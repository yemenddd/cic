import { defineField, defineType } from 'sanity';

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  fields: [
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: { list: [{ title: 'Film edition', value: 'film' }, { title: 'TV', value: 'tv' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'editionLabel', title: 'Edition label', type: 'localeString', description: 'Only used when section = film' }),
    defineField({ name: 'title', title: 'Title', type: 'localeString' }),
    defineField({ name: 'videoId', title: 'YouTube video ID', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ar', subtitle: 'section' },
  },
});
