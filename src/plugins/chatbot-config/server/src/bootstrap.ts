import { Core } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const knex = strapi.db.connection;

  // Auto-Migration
  setTimeout(async () => {
    try {
      if (knex.client.config.client !== 'postgres' && knex.client.config.client !== 'postgresql') return;

      await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
      const tableName = 'chatbot_config_faqs';
      
      if (await knex.schema.hasTable(tableName)) {
        const hasColumn = await knex.schema.hasColumn(tableName, 'embedding');
        if (!hasColumn) {
          await knex.raw(`ALTER TABLE ${tableName} ADD COLUMN embedding vector(1536)`);
          console.log('Vector column Created in FAQs table');
        }
      }
    } catch (err: any) {
      console.error('Chatbot-Config Setup Error:', err.message);
    }
  }, 2000);

  // Lifecycles
  strapi.db.lifecycles.subscribe({
    models: ['plugin::chatbot-config.faq'], 
    async afterCreate(event) {
      await strapi.plugin('chatbot-config').service('service').updateEmbeddingsForEntry(event.model.uid, event.result);
    },
    async afterUpdate(event) {
      await strapi.plugin('chatbot-config').service('service').updateEmbeddingsForEntry(event.model.uid, event.result);
    },
  });
};