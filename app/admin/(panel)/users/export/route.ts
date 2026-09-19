import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { parseUserFilters, userOrderBy, userWhere } from '@/lib/admin-users';
import { toCsv } from '@/lib/csv';

/**
 * The directory as a spreadsheet — the rows currently on screen, not all of
 * them.
 *
 * The filters are re-parsed from the same query string the page used, through
 * the same helpers, so "export" can only ever mean "this list". An export that
 * quietly widened to everybody is the sort of mistake that is discovered after
 * the file has been forwarded.
 *
 * Guarded here in its own right: a route handler does not sit under the panel
 * layout, so nothing above it has checked who is asking. proxy.ts reads the
 * role from the JWT, which is a stale copy — this is the real boundary, and
 * this file returns every attendee's phone number and email.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return new Response('Forbidden', { status: 403 });
  }

  const filters = parseUserFilters(Object.fromEntries(request.nextUrl.searchParams));

  const users = await prisma.user.findMany({
    where: userWhere(filters),
    orderBy: userOrderBy(filters.sort),
    select: {
      name: true, email: true, phone: true, country: true, organization: true,
      role: true, category: true, track: true, confirmationCode: true, createdAt: true,
      _count: { select: { submissions: true, savedSessions: true, attendance: true } },
    },
  });

  const csv = toCsv(
    ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'الجهة', 'الصلاحية', 'الفئة', 'المسار', 'رمز التأكيد', 'الحضور', 'الابتكارات', 'الجلسات المحفوظة', 'تاريخ الانضمام'],
    users.map((u) => [
      u.name,
      u.email,
      u.phone,
      u.country,
      u.organization,
      u.role === 'ADMIN' ? 'مدير' : 'مشارك',
      categoryLabel(u.category, 'ar'),
      u.track,
      u.confirmationCode,
      u._count.attendance > 0 ? `حضر (${u._count.attendance})` : 'لم يحضر',
      u._count.submissions,
      u._count.savedSessions,
      new Date(u.createdAt).toLocaleDateString('ar'),
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cict-users.csv"',
      // Never cached: it is a snapshot of personal data behind an auth check.
      'Cache-Control': 'no-store',
    },
  });
}
