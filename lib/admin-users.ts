import type { Prisma, UserRole } from '@prisma/client';
import { CATEGORIES } from '@/lib/categories';

/**
 * How the admin user directory is filtered, sorted and paged.
 *
 * It lives here rather than inside the page because the CSV export must return
 * *the list the admin is looking at*. When the two built their own query, an
 * export taken from a filtered screen quietly contained everybody — which is
 * the kind of bug that is only noticed after the file has been sent on.
 *
 * Everything here is a pure function of the query string, so the rules can be
 * checked without a database or a request.
 */

/** Rows per page. Large enough to scan, small enough to stay one query. */
export const USERS_PAGE_SIZE = 25;

/** Category filter value for accounts that never got one. */
export const CATEGORY_NONE = 'none';

export type AttendanceFilter = '' | 'present' | 'absent';

export const USER_SORTS = [
  { value: 'recent', label: 'الأحدث انضماماً' },
  { value: 'oldest', label: 'الأقدم انضماماً' },
  { value: 'name', label: 'الاسم (أ–ي)' },
  { value: 'active', label: 'الأكثر تقديماً للابتكارات' },
] as const;

export type UserSort = (typeof USER_SORTS)[number]['value'];

export interface UserFilters {
  q: string;
  role: UserRole | '';
  category: string;
  country: string;
  attendance: AttendanceFilter;
  sort: UserSort;
  page: number;
}

/** The query string a list page may receive. Every value is optional. */
export type UserSearchParams = Partial<Record<keyof UserFilters, string>>;

function isSort(value: string): value is UserSort {
  return USER_SORTS.some((s) => s.value === value);
}

function isCategory(value: string): boolean {
  return value === CATEGORY_NONE || CATEGORIES.some((c) => c.id === value);
}

/**
 * Read the filters out of a URL.
 *
 * Anything unrecognised falls back to "no filter" rather than being passed to
 * Prisma. A role of `DROP` is not a database error worth surfacing; it is a
 * link somebody edited, and the honest answer to it is the unfiltered list.
 */
export function parseUserFilters(params: UserSearchParams = {}): UserFilters {
  const role = (params.role ?? '').toUpperCase();
  const category = params.category ?? '';
  const attendance = params.attendance ?? '';
  const sort = params.sort ?? '';
  const page = Number.parseInt(params.page ?? '1', 10);

  return {
    q: (params.q ?? '').trim().slice(0, 120),
    role: role === 'ADMIN' || role === 'ATTENDEE' ? role : '',
    category: isCategory(category) ? category : '',
    country: (params.country ?? '').trim().slice(0, 100),
    attendance: attendance === 'present' || attendance === 'absent' ? attendance : '',
    sort: isSort(sort) ? sort : 'recent',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
}

/** The filters as a query string, for links that change one of them. */
export function userFiltersToQuery(filters: UserFilters, overrides: Partial<UserFilters> = {}): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set('q', merged.q);
  if (merged.role) params.set('role', merged.role);
  if (merged.category) params.set('category', merged.category);
  if (merged.country) params.set('country', merged.country);
  if (merged.attendance) params.set('attendance', merged.attendance);
  if (merged.sort !== 'recent') params.set('sort', merged.sort);
  // Any change of filter invalidates the page number — page 4 of a narrower
  // result set is usually empty, which reads as "no matches" rather than as
  // "you are past the end".
  if (merged.page > 1 && overrides.page !== undefined) params.set('page', String(merged.page));

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * The Prisma filter.
 *
 * The search runs across every field an organizer has in front of them when
 * somebody is standing at the desk: a name, an email, a phone number, the
 * organization on their badge, or the confirmation code printed on it.
 */
export function userWhere(filters: UserFilters): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];

  if (filters.q) {
    const contains = { contains: filters.q, mode: 'insensitive' as const };
    and.push({
      OR: [
        { name: contains },
        { email: contains },
        { phone: contains },
        { organization: contains },
        { confirmationCode: contains },
      ],
    });
  }

  if (filters.role) and.push({ role: filters.role });

  if (filters.category === CATEGORY_NONE) {
    // Both spellings of "never chose one": the column is nullable, and the
    // registration form can post an empty string.
    and.push({ OR: [{ category: null }, { category: '' }] });
  } else if (filters.category) {
    and.push({ category: filters.category });
  }

  if (filters.country) and.push({ country: filters.country });

  // Attendance is a relation, so "absent" is `none`, not `not: present` — the
  // latter would also exclude everybody the query has not joined.
  if (filters.attendance === 'present') and.push({ attendance: { some: {} } });
  if (filters.attendance === 'absent') and.push({ attendance: { none: {} } });

  return and.length > 0 ? { AND: and } : {};
}

export function userOrderBy(sort: UserSort): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'name':
      // Accounts without a name sort last rather than heading the list.
      return [{ name: { sort: 'asc', nulls: 'last' } }, { email: 'asc' }];
    case 'active':
      return [{ submissions: { _count: 'desc' } }, { createdAt: 'desc' }];
    case 'recent':
    default:
      // Admins first, then newest signups — the handful of accounts that can
      // change anything should never be buried under a page of attendees.
      return [{ role: 'asc' }, { createdAt: 'desc' }];
  }
}

export function isFiltered(filters: UserFilters): boolean {
  return Boolean(
    filters.q || filters.role || filters.category || filters.country || filters.attendance,
  );
}
