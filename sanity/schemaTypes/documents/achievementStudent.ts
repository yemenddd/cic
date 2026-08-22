import { defineField, defineType } from 'sanity';

export const achievementStudent = defineType({
  name: 'achievementStudent',
  title: 'Achievement Student',
  type: 'document',
  fields: [
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'achievementEdition' }],
      validation: (r) => r.required(),
    }),
    defineField({ name: 'studentId', title: 'Student ID', type: 'string', description: 'Stable id, e.g. e1-s01', validation: (r) => r.required() }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'members', title: 'Team members', type: 'array', of: [{ type: 'string' }], description: 'Only for team entries' }),
    defineField({ name: 'projectTitle', title: 'Project title', type: 'localeString' }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      options: { list: [{ title: 'Innovator', value: 'innovator' }, { title: 'Participant', value: 'participant' }] },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (r) => r.max(3),
    }),
    defineField({ name: 'videoId', title: 'YouTube video ID', type: 'string' }),
    defineField({ name: 'color', title: 'Accent color', type: 'string' }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
  orderings: [{ name: 'orderAsc', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'projectTitle.ar' },
  },
});
