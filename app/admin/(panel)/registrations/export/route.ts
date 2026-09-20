import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { csvResponse } from '@/lib/csv';
import { inPages } from '@/lib/export-pages';
import {
  parseRegistrationFilters,
  registrationOrderBy,
  registrationWhere,
} from '@/lib/admin-registrations';

/** Streamed a page at a time — see the users export for why. */
export const maxDuration = 60;

/**
 * The registrations list as a spreadsheet — the rows currently on screen, not
 * all of them.
 *
 * The filters are re-parsed from the same query string the page used, through
 * the same helpers, so "export" can only ever mean "this list".
 *
 * Guarded in its own right: a route handler does not sit under the panel
 * layout, so nothing above it has checked who is asking. proxy.ts reads the
 * role from the JWT — a copy written at sign-in and carried for up to 30 days
 * — which means a demoted organizer could still pull this file. It contains
 * every registrant's email and phone number, so the check belongs here too.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return new Response('Forbidden', { status: 403 });
  }

  const filters = parseRegistrationFilters(Object.fromEntries(request.nextUrl.searchParams));

  const pages = inPages((after, take) =>
    prisma.registration.findMany({
      where: registrationWhere(filters),
      // Same order as the screen, so the spreadsheet reads in the sequence the
      // admin was looking at rather than a second, silently different one —
      // then id, which is what makes the cursor's order total.
      orderBy: [...registrationOrderBy(filters.sort), { id: 'asc' }],
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
      take,
    }),
  );

  return csvResponse(
    'registrations.csv',
    ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'المؤسسة', 'الفئة', 'المسار', 'رمز التأكيد', 'له حساب', 'تاريخ التسجيل'],
    (async function* () {
      for await (const page of pages) {
        yield page.map((r) => [
          r.fullName,
          r.email,
          r.phone,
          r.country,
          r.organization,
          categoryLabel(r.category, 'ar') || r.category,
          r.track,
          r.confirmationCode,
          r.userId ? 'نعم' : 'لا',
          new Date(r.submittedAt).toLocaleDateString('ar'),
        ]);
      }
    })(),
  );
}
