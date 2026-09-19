import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { toCsv } from '@/lib/csv';

/**
 * Guarded in its own right: a route handler does not sit under the panel
 * layout, so nothing above it has checked who is asking. proxy.ts reads the
 * role from the JWT — a copy written at sign-in and carried for up to 30 days
 * — which means a demoted organizer could still pull this file. It contains
 * every registrant's email and phone number, so the check belongs here too.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return new Response('Forbidden', { status: 403 });
  }

  const registrations = await prisma.registration.findMany({ orderBy: { submittedAt: 'desc' } });

  const csv = toCsv(
    ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'المؤسسة', 'الفئة', 'المسار', 'رمز التأكيد', 'تاريخ التسجيل'],
    registrations.map((r) => [
      r.fullName,
      r.email,
      r.phone,
      r.country,
      r.organization,
      categoryLabel(r.category, 'ar') || r.category,
      r.track,
      r.confirmationCode,
      new Date(r.submittedAt).toLocaleDateString('ar'),
    ]),
  );

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="registrations.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
