import { defineField, defineType } from 'sanity';

// Every user-facing string in the site exists in ar/en/tr — this mirrors the
// {ar, en, tr} shape components already read via useLang()/tx() today.
export const localeString = defineType({
  name: 'localeString',
  title: 'Localized string',
  type: 'object',
  fields: [
    defineField({ name: 'ar', title: 'العربية', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'en', title: 'English', type: 'string' }),
    defineField({ name: 'tr', title: 'Türkçe', type: 'string' }),
  ],
});
