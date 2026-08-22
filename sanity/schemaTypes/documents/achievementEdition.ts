import { defineField, defineType } from 'sanity';

export const achievementEdition = defineType({
  name: 'achievementEdition',
  title: 'Achievement Edition',
  type: 'document',
  fields: [
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'year' }, validation: (r) => r.required() }),
    defineField({ name: 'number', title: 'Number', type: 'number', description: '1, 2, 3… — used for "الدورة الأولى/الثانية" copy', validation: (r) => r.required() }),
    defineField({ name: 'year', title: 'Year', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'title', title: 'Title', type: 'localeString' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ar', subtitle: 'year' },
  },
});
