import type { Prisma } from '@prisma/client';
import { CATEGORIES } from '@/lib/categories';

/**
 * How the registrations list is filtered.
 *
 * Separate from the page for the same reason lib/admin-users.ts is: the CSV
 * export has to return the list the admin is looking at, and when the two
 * build their own query an export taken from a filtered screen quietly
 * contains everybody. That is discovered after the file has been forwarded.
 *
 * Pure functions of the query string, so the rules are checkable without a
 * database or a request.
 */

export type LinkedFilter = '' | 'yes' | 'no';

export const REGISTRATION_SORTS = [
  { value: 'recent', label: 'الأحدث تسجيلاً' },
  { value: 'oldest', label: 'الأقدم تسجيلاً' },
  { value: 'name', label: 'الاسم (أ–ي)' },
] as const;

export type RegistrationSort = (typeof REGISTRATION_SORTS)[number]['value'];

export interface RegistrationFilters {
  q: string;
  category: string;
  /** Whether the registration has an account behind it. */
  linked: LinkedFilter;
  sort: RegistrationSort;
  page: number;
}

export type RegistrationSearchParams = Partial<Record<keyof RegistrationFilters, string>>;

export function parseRegistrationFilters(
  params: RegistrationSearchParams = {},
): RegistrationFilters {
  const category = params.category ?? '';
  const linked = params.linked ?? '';
  const sort = params.sort ?? '';
  const page = Number.parseInt(params.page ?? '1', 10);

  return {
    q: (params.q ?? '').trim().slice(0, 120),
    // Validated against the shared list rather than passed through: an unknown
    // value would return an empty page that reads as "no registrations".
    category: CATEGORIES.some((c) => c.id === category) ? category : '',
    linked: linked === 'yes' || linked === 'no' ? linked : '',
    sort: REGISTRATION_SORTS.some((s) => s.value === sort) ? (sort as RegistrationSort) : 'recent',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

export function registrationOrderBy(
  sort: RegistrationSort,
): Prisma.RegistrationOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ submittedAt: 'asc' }];
    case 'name':
      return [{ fullName: 'asc' }];
    case 'recent':
    default:
      return [{ submittedAt: 'desc' }];
  }
}

export function registrationWhere(filters: RegistrationFilters): Prisma.RegistrationWhereInput {
  const and: Prisma.RegistrationWhereInput[] = [];

  if (filters.q) {
    const contains = { contains: filters.q, mode: 'insensitive' as const };
    and.push({
      OR: [
        { fullName: contains },
        { email: contains },
        { phone: contains },
        { organization: contains },
        { confirmationCode: contains },
      ],
    });
  }

  if (filters.category) and.push({ category: filters.category });

  // Registrations taken before accounts existed have no owner, so those people
  // cannot sign in, hold a badge or be scanned at the door. Listing them is the
  // only way to find who still needs an account created.
  if (filters.linked === 'yes') and.push({ userId: { not: null } });
  if (filters.linked === 'no') and.push({ userId: null });

  return and.length > 0 ? { AND: and } : {};
}

export function isRegistrationFiltered(filters: RegistrationFilters): boolean {
  return Boolean(filters.q || filters.category || filters.linked);
}

/**
 * Which of these addresses appear on more than one registration.
 *
 * Nothing stops somebody filling in the public form twice — the column is not
 * unique, and a person who is unsure whether the first submission worked will
 * simply do it again. Two rows for one person inflates every headcount the
 * organizers plan catering and seating from, and the duplicate is invisible in
 * a list sorted by date because the two are weeks apart.
 *
 * Scoped to the addresses passed in, so this stays one indexed pass over the
 * page being rendered rather than a scan of the whole table.
 */
export function duplicateEmailsAmong(
  rows: { email: string; _count?: never }[],
): { email: { in: string[] } } {
  return { email: { in: [...new Set(rows.map((r) => r.email))] } };
}
