import { defineField, defineType } from 'sanity';

// Written only by app/api/register (server-side, using SANITY_API_TOKEN).
// Not queried by the public site — this is purely an organizer-facing record.
export const registration = defineType({
  name: 'registration',
  title: 'Registration',
  type: 'document',
  fields: [
    defineField({ name: 'fullName', title: 'Full name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'country', title: 'Country', type: 'string' }),
    defineField({ name: 'organization', title: 'Organization', type: 'string' }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'track', title: 'Track', type: 'string' }),
    defineField({ name: 'confirmationCode', title: 'Confirmation code', type: 'string' }),
    defineField({ name: 'submittedAt', title: 'Submitted at', type: 'datetime' }),
  ],
  orderings: [{ name: 'submittedDesc', title: 'Newest first', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'fullName', subtitle: 'email' },
  },
});
