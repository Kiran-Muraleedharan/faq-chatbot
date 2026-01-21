export default {
  routes: [
    {
      method: 'POST',
      path: '/faqs/ask',
      handler: 'api::faq.faq.ask',
      config: {
        auth: false,
      },
    },
  ],
};