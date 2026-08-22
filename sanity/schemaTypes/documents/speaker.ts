import { defineField, defineType } from 'sanity';

export const speaker = defineType({
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString' }),
    defineField({ name: 'role', title: 'Role', type: 'localeString' }),
    defineField({ name: 'organization', title: 'Organization', type: 'localeString' }),
    defineField({ name: 'topic', title: 'Topic', type: 'localeString' }),
    defineField({ name: 'bio', title: 'Bio', type: 'localeText' }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.ar', subtitle: 'role.ar', media: 'photo' },
  },
});
