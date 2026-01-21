import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

//Perform the DB update
async function saveVectorToDB(id: number, text: string) {
  try {
    const embeddingVector = await generateEmbedding(text);
    
    if (!embeddingVector) return;

    const updateResult = await strapi.db.connection('faqs')
      .where({ id: id })
      .update({
        embedding: strapi.db.connection.raw('?::vector', [JSON.stringify(embeddingVector)])
      });

    console.log(` Embedding saved for ID: ${id}. Rows updated: ${updateResult}`);
  } catch (err) {
    console.error(` Failed to save vector for ID ${id}`, err);
  }
}


function scheduleEmbeddingUpdate(result: any) {
  if (!result || !result.id) return;

  const textToEmbed = `Q: ${result.question} \n A: ${result.answer}`;

  setTimeout(() => {
    saveVectorToDB(result.id, textToEmbed);
  }, 1000);
}

export default {
  async afterCreate(event) {
    scheduleEmbeddingUpdate(event.result);
  },

  async afterUpdate(event) {
    scheduleEmbeddingUpdate(event.result);
  },

  async afterDelete(event) {
    console.log(`FAQ ID ${event.result.id} deleted.`);
  },
};