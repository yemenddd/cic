import { defineField, defineType } from 'sanity';

export const historyEdition = defineType({
  name: 'historyEdition',
  title: 'History Edition',
  type: 'document',
  fields: [
    defineField({ name: 'year', title: 'Year', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'Title', type: 'localeString' }),
    defineField({ name: 'description', title: 'Description', type: 'localeText' }),
    defineField({ name: 'attendees', title: 'Attendees', type: 'string', description: 'Display text, e.g. "+5,000"' }),
    defineField({ name: 'speakersCount', title: 'Speakers count', type: 'string', description: 'Display text, e.g. "+120"' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ar', subtitle: 'year' },
  },
});
