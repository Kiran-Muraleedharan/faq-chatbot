import type { Schema, Struct } from '@strapi/strapi';

export interface FaqCategory extends Struct.ComponentSchema {
  collectionName: 'components_faq_categories';
  info: {
    displayName: 'Category';
    icon: 'command';
  };
  attributes: {
    items: Schema.Attribute.Component<'faq.faq-item', true>;
    title: Schema.Attribute.String;
  };
}

export interface FaqFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_faq_faq_items';
  info: {
    displayName: 'FAQ Item';
    icon: 'lightbulb';
  };
  attributes: {
    answer: Schema.Attribute.RichText & Schema.Attribute.Required;
    question: Schema.Attribute.Text & Schema.Attribute.Required;
    tags: Schema.Attribute.JSON;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'faq.category': FaqCategory;
      'faq.faq-item': FaqFaqItem;
    }
  }
}
