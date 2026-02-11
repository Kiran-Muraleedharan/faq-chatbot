import { Core } from '@strapi/strapi';
import OpenAI from 'openai';

interface PluginSettings {
  config?: Record<string, string[]>;
  openaiKey?: string;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  //Settings Panel
  async getSettings(): Promise<PluginSettings | null> {
    const pluginStore = strapi.store({ type: 'plugin', name: 'chatbot-config' });
    return await pluginStore.get({ key: 'settings' }) as PluginSettings | null;
  },

  async setSettings(settings: PluginSettings) {
    const pluginStore = strapi.store({ type: 'plugin', name: 'chatbot-config' });
    return await pluginStore.set({ key: 'settings', value: settings });
  },

  //Fetches content types
  async getContentTypes() {
    const contentTypes = strapi.contentTypes;
    const SYSTEM_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'locale', 'localizations', 'embedding'];

    return Object.keys(contentTypes)
      .filter((uid) => uid.startsWith('api::') || uid === 'plugin::chatbot-config.faq')
      .map((uid) => {
        const ct = contentTypes[uid as keyof typeof contentTypes];
        return {
          uid,
          displayName: ct.info.displayName,
          attributes: Object.keys(ct.attributes)
            .filter(attr => !SYSTEM_FIELDS.includes(attr))
            .map(attr => ({ name: attr, type: ct.attributes[attr].type }))
        };
      });
  },


  async generateEmbedding(text: string, customApiKey?: string) {
    try {
      const apiKey = customApiKey || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.error('Chatbot-Config: No OpenAI API Key found in settings or .env');
        return null;
      }

      const openai = new OpenAI({ apiKey });

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      console.error("Chatbot-Config OpenAI Error:", error.message);
      return null;
    }
  },


  async updateEmbeddingsForEntry(uid: string, result: any) {
    // Capture document identifiers and data
    const docId = result.documentId;
    const numericId = result.id;
    const entryData = { ...result };
    
    const model = strapi.contentType(uid as any);
    const tableName = model.collectionName;

    // Timeout for Strapi lifecycle transaction
    setTimeout(async () => {
      try {
        const knex = strapi.db.connection;

        // FETCH SETTINGS via Raw SQL 
        const storeRow = await knex('strapi_core_store_settings')
          .where({ key: 'plugin_chatbot-config_settings' })
          .first();

        if (!storeRow || !storeRow.value) return;
        
        const settings: PluginSettings = JSON.parse(storeRow.value);
        const config = settings.config || {};
        const savedOpenaiKey = settings.openaiKey;

        if (!config[uid]) return;

        // PREPARE TEXT FROM SELECTED FIELDS
        const selectedFields = config[uid];
        const textToEmbed = selectedFields
          .map((field: string) => `${field}: ${entryData[field] || ''}`)
          .join('\n').trim();

        if (!textToEmbed) return;

        const vector = await this.generateEmbedding(textToEmbed, savedOpenaiKey);
        if (!vector) return;

        const vectorString = `[${vector.join(',')}]`;

        // UPDATE DB via Raw SQL
        if (docId) {
          await knex.raw(
            `UPDATE ${tableName} SET embedding = ?::vector WHERE document_id = ?`,
            [vectorString, docId]
          );
        } else {
          await knex.raw(
            `UPDATE ${tableName} SET embedding = ?::vector WHERE id = ?`,
            [vectorString, numericId]
          );
        }

        console.log(`Chatbot-Config: Vector SAVED for ${docId || numericId} ---`);
      } catch (error: any) {
        console.error('Chatbot-Config Background Error:', error.message);
      }
    }, 1500); 
  }
});