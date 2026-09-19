import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { toCsv } from '@/lib/csv';
import { ATTENDANCE_METHOD_LABELS, dayLabel } from '@/lib/attendance';

const STAMP = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'short', timeStyle: 'medium' });

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

  const rows = await prisma.attendance.findMany({
    orderBy: { checkedInAt: 'asc' },
    select: {
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
  });

  const csv = toCsv(
    ['الاسم', 'البريد', 'الهاتف', 'الجهة', 'الفئة', 'رمز التأكيد', 'نقطة الحضور', 'اليوم', 'وقت التسجيل', 'الطريقة', 'سجّله'],
    rows.map((r) => [
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
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cict-attendance.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
