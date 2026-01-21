import { factories } from '@strapi/strapi';
import OpenAI from 'openai';
import { PassThrough } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SIMILARITY_THRESHOLD = 0.85;
const OPENAI_TIMEOUT_MS = 30000;

// rewriter
async function rephraseQuestion(history: any[], newQuestion: string) {
  if (!history || !Array.isArray(history) || history.length === 0) return newQuestion;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Search Query Optimizer.
          Your task is to determine if the user's new message is a **Follow-up** or a **New Topic** and if a follow-up just rewrite the question (don't answer the question).

          ### RULES
          1. **Dependency Check (The "Pronoun" Rule):**
             - ONLY combine with history if the new question contains **Pronouns** ("it", "that", "they") or is **Grammatically Incomplete** ("How much?", "Where do I buy?", "Is it refundable?").
             
          2. **Independence Check (The "Specifics" Rule):**
             - If the user asks a complete question containing a **New Specific Noun** or **Scenario** (e.g., "Group of 7 people", "Booking for pets"), treat it as a **Standalone Query**.
             - **Do NOT** attach the previous topic to it.
             - *Example:* History="Commuter Pass", Input="Can I book for a group of 7?" -> Output="Group booking for 7 people" (Correct).
             - *Bad Output:* "Group booking for Commuter Pass" (Incorrect).

          3. **Output:**
             - Return ONLY the optimized search string.`
        },

        ...history.slice(-4).map(msg => ({ role: msg.role, content: msg.content })),
        { role: "user", content: newQuestion }
      ],
      temperature: 0,
    });
   
    const rewritten = response.choices[0].message.content;

    console.log(`Original: "${newQuestion}" -> Rewritten: "${rewritten}"`);

    return rewritten || newQuestion;
  } catch (e) {
    return newQuestion;
  }
}

export default factories.createCoreController('api::faq.faq', ({ strapi }) => ({

  async ask(ctx) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), OPENAI_TIMEOUT_MS);

    try {
      const { question, history } = ctx.request.body;

      if (!question || typeof question !== 'string') {
        return ctx.badRequest('Invalid question.');
      }
     
      ctx.req.on('close', () => {
        if (!ctx.res.writableEnded) abortController.abort();
      });

      const standaloneQuestion = await rephraseQuestion(history, question);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: standaloneQuestion,
        encoding_format: "float",
      }, { signal: abortController.signal });
     
      const questionVector = embeddingResponse.data[0].embedding;

      const searchResults = await strapi.db.connection.raw(
        `
        SELECT id, question, answer,
        (embedding <=> ?::vector) as distance
        FROM faqs
        WHERE published_at IS NOT NULL
        ORDER BY distance ASC
        LIMIT 4;
        `,
        [JSON.stringify(questionVector)]
      );

      const rows = searchResults.rows;

      if (rows.length === 0 || rows[0].distance > SIMILARITY_THRESHOLD) {
        clearTimeout(timeoutId);
        return ctx.send({
          type: 'no_match',
          answer: "I couldn't find this information in our knowledge base.",
          sources: []
        });
      }

      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      ctx.status = 200;

      const stream = new PassThrough();
      ctx.body = stream;

      // context block creation
      const contextBlock = rows.map((row) => `Q: ${row.question}\nA: ${row.answer}`).join("\n---\n");
      const sources = rows.map(r => r.question);

      const sendSSE = (event: string, data: any) => {
        stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      sendSSE('metadata', { sources });

     
      // Extract last assistant message
      let lastAssistantMessage = "None";
      if (history && Array.isArray(history)) {
        const lastMsg = [...history].reverse().find(m => m.role === 'assistant');
        if (lastMsg && lastMsg.content) lastAssistantMessage = lastMsg.content;
      }

      const systemPrompt = `
      ### ROLE
      You are a specialized Knowledge-Base Assistant acting as a plugin for this website.

            ### CORE INSTRUCTIONS
            1. **Source of Truth:** Use the [CONTEXT] below.
            2. **Smart Inference:** Correct typos and infer intent.
            3. **Semantic Flexibility:** If user asks broadly (e.g., "Policy") and the context has specifics, synthesize the answer.

            ### RESPONSE LOGIC
            *   **CASE A: Yes/No Questions**
                *   Output: Exactly ONE single sentence.
                *   Rule: Start with "Yes," or "No," AND immediately include the condition/rule from context.
            *   **CASE B: Quantitative Questions**
                *   Output: Exactly ONE single sentence with the value.
            *   **CASE C: General / Explanatory**
                *   Output: Direct answer followed by details.


      ### DATABASE CONTEXT
      ${contextBlock}

      ### LAST MESSAGE (For Context Only)
      "${lastAssistantMessage}"

      ### CURRENT USER INPUT
      Original: "${question}"
      (System Note: Interpreted for search as: "${standaloneQuestion}")
      `;

      // answer generation
      const completionStream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt }
        ],
        temperature: 0.3,
      }, { signal: abortController.signal });

      clearTimeout(timeoutId);

      (async () => {
        try {
          // stream processing loop
          for await (const chunk of completionStream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              stream.write(`data: ${JSON.stringify(content)}\n\n`);
            }
          }
          sendSSE('done', {});
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('[Stream] Error:', error);
            sendSSE('error', { message: 'Stream interrupted' });
          }
        } finally {
          stream.end();
        }
      })();

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('RAG Controller Error:', error);
      if (!ctx.res.headersSent) {
        return ctx.internalServerError('Failed to process request');
      }
    }
  }
}));
