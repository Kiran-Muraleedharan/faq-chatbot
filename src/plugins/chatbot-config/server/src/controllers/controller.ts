import { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getConfigs(ctx) {
    try {
      const service = strapi.plugin('chatbot-config').service('service');
      const contentTypes = await service.getContentTypes();
      const settings = await service.getSettings();

      console.log('Sending to frontend:', { contentTypes, settings });

      ctx.body = { contentTypes, settings };
    } catch (err) {
      console.error('Error in getConfigs:', err);
      ctx.throw(500, err);
    }
  },

  async updateConfig(ctx) {
    try {
      const { body } = ctx.request;
      await strapi.plugin('chatbot-config').service('service').setSettings(body);
      ctx.body = { ok: true };
    } catch (err) {
      ctx.throw(500, err);
    }
  },
});