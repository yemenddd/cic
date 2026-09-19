import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { toCsv } from '@/lib/csv';
import { parseRegistrationFilters, registrationWhere } from '@/lib/admin-registrations';

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

  const registrations = await prisma.registration.findMany({
    where: registrationWhere(filters),
    orderBy: { submittedAt: 'desc' },
  });

  const csv = toCsv(
    ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'المؤسسة', 'الفئة', 'المسار', 'رمز التأكيد', 'له حساب', 'تاريخ التسجيل'],
    registrations.map((r) => [
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
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="registrations.csv"',
      // Never cached: it is a snapshot of personal data behind an auth check.
      'Cache-Control': 'no-store',
    },
  });
}
