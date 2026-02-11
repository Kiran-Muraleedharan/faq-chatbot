export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/config',
      handler: 'controller.getConfigs',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/config',
      handler: 'controller.updateConfig',
      config: { policies: [] },
    },
  ],
};