export default {
  kind: 'collectionType',
  collectionName: 'chatbot_config_faqs',
  info: {
    singularName: 'faq',
    pluralName: 'faqs',
    displayName: 'Chatbot FAQ',
  },
  options: {
    draftAndPublish: true,
  },
  attributes: {
    question: {
      type: 'text',
      required: true,
    },
    answer: {
      type: 'richtext',
      required: true,
    },
  },
};