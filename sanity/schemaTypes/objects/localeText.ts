import { defineField, defineType } from 'sanity';

// Same as localeString but for longer copy (bios, descriptions).
export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text',
  type: 'object',
  fields: [
    defineField({ name: 'ar', title: 'العربية', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'en', title: 'English', type: 'text', rows: 4 }),
    defineField({ name: 'tr', title: 'Türkçe', type: 'text', rows: 4 }),
  ],
});
