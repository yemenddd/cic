import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { csvResponse } from '@/lib/csv';
import { inPages } from '@/lib/export-pages';
import { ATTENDANCE_METHOD_LABELS, dayLabel } from '@/lib/attendance';

const STAMP = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'short', timeStyle: 'medium' });

/** Streamed a page at a time — see the users export for why. */
export const maxDuration = 60;

/**
 * The attendance register, one row per person per checkpoint.
 *
 * Guarded in its own right: a route handler does not sit under the panel
 * layout, and this file is the conference's record of who was in the building.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return new Response('Forbidden', { status: 403 });
  }

  const pages = inPages((after, take) =>
    prisma.attendance.findMany({
      // Chronological, then id so the cursor has a total order: a busy door
      // produces scans inside the same millisecond.
      orderBy: [{ checkedInAt: 'asc' }, { id: 'asc' }],
      ...(after ? { cursor: { id: after }, skip: 1 } : {}),
      take,
      select: {
        id: true,
        checkedInAt: true,
        method: true,
        user: {
          select: {
            name: true, email: true, phone: true, organization: true,
            category: true, confirmationCode: true,
          },
        },
        checkpoint: { select: { nameAr: true, day: true } },
        recordedBy: { select: { name: true, email: true } },
      },
    }),
  );

  return csvResponse(
    'cict-attendance.csv',
    ['الاسم', 'البريد', 'الهاتف', 'الجهة', 'الفئة', 'رمز التأكيد', 'نقطة الحضور', 'اليوم', 'وقت التسجيل', 'الطريقة', 'سجّله'],
    (async function* () {
      for await (const page of pages) {
        yield page.map((r) => [
          r.user.name,
          r.user.email,
          r.user.phone,
          r.user.organization,
          categoryLabel(r.user.category, 'ar'),
          r.user.confirmationCode,
          r.checkpoint.nameAr,
          dayLabel(r.checkpoint.day),
          STAMP.format(r.checkedInAt),
          ATTENDANCE_METHOD_LABELS[r.method],
          r.recordedBy?.name ?? r.recordedBy?.email ?? '',
        ]);
      }
    })(),
  );
}
