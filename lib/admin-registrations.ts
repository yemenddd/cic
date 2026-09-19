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

export interface RegistrationFilters {
  q: string;
  category: string;
  /** Whether the registration has an account behind it. */
  linked: LinkedFilter;
  page: number;
}

export type RegistrationSearchParams = Partial<Record<keyof RegistrationFilters, string>>;

export function parseRegistrationFilters(
  params: RegistrationSearchParams = {},
): RegistrationFilters {
  const category = params.category ?? '';
  const linked = params.linked ?? '';
  const page = Number.parseInt(params.page ?? '1', 10);

  return {
    q: (params.q ?? '').trim().slice(0, 120),
    // Validated against the shared list rather than passed through: an unknown
    // value would return an empty page that reads as "no registrations".
    category: CATEGORIES.some((c) => c.id === category) ? category : '',
    linked: linked === 'yes' || linked === 'no' ? linked : '',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
  };
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
