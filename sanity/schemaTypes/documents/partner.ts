import { defineField, defineType } from 'sanity';

export const partner = defineType({
  name: 'partner',
  title: 'Partner',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'logo', title: 'Logo', type: 'image', validation: (r) => r.required() }),
    defineField({ name: 'url', title: 'Website URL', type: 'url' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', media: 'logo' },
  },
});
