import { defineField, defineType } from 'sanity';

export const programSession = defineType({
  name: 'programSession',
  title: 'Program Session',
  type: 'document',
  fields: [
    defineField({
      name: 'day',
      title: 'Day',
      type: 'string',
      options: { list: [{ title: 'Day 1', value: 'dayOne' }, { title: 'Day 2', value: 'dayTwo' }] },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'time', title: 'Time', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'localeString' }),
    defineField({ name: 'speakerName', title: 'Speaker name', type: 'localeString' }),
    defineField({ name: 'speakerRole', title: 'Speaker role', type: 'localeString' }),
    defineField({ name: 'speakerPhoto', title: 'Speaker photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'track', title: 'Track', type: 'localeString' }),
    defineField({ name: 'color', title: 'Accent color', type: 'string', description: 'Hex or CSS color used as the card accent' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ar', subtitle: 'time', media: 'speakerPhoto' },
  },
});
