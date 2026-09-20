import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { parseUserFilters, userOrderBy, userWhere } from '@/lib/admin-users';
import { csvResponse } from '@/lib/csv';
import { inPages } from '@/lib/export-pages';

/**
 * Streamed a page at a time, so this holds one page rather than the whole
 * directory. Raised from the default because the work is now spread across the
 * length of the download instead of happening before it starts.
 */
export const maxDuration = 60;

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

  const pages = inPages(async (after, take) => {
    const rows = await prisma.user.findMany({
      where: userWhere(filters),
      // The chosen sort, then id — a cursor needs a total order, and every
      // sort offered here can tie. Two accounts created in the same
      // millisecond would otherwise straddle a page boundary, and one of them
      // would be dropped from the file or written into it twice.
      orderBy: [...userOrderBy(filters.sort), { id: 'asc' }],
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
      take,
      select: {
        id: true,
        name: true, email: true, phone: true, country: true, organization: true,
        role: true, category: true, track: true, confirmationCode: true, createdAt: true,
        _count: { select: { submissions: true, savedSessions: true, attendance: true } },
      },
    });
    return rows;
  });

  return csvResponse(
    'cict-users.csv',
    ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'الجهة', 'الصلاحية', 'الفئة', 'المسار', 'رمز التأكيد', 'الحضور', 'الابتكارات', 'الجلسات المحفوظة', 'تاريخ الانضمام'],
    (async function* () {
      for await (const page of pages) {
        yield page.map((u) => [
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
        ]);
      }
    })(),
  );
}
