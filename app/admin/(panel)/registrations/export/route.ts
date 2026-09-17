import { prisma } from '@/lib/db/client';

const CATEGORY_LABELS: Record<string, string> = {
  visitor: 'زائر',
  participant: 'مشارك',
  volunteer: 'متطوع',
};

function csvCell(value: string | null | undefined): string {
  const raw = value ?? '';
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export async function GET() {
  const registrations = await prisma.registration.findMany({ orderBy: { submittedAt: 'desc' } });

  const header = ['الاسم', 'البريد', 'الهاتف', 'الدولة', 'المؤسسة', 'الفئة', 'المسار', 'رمز التأكيد', 'تاريخ التسجيل'];
  const rows = registrations.map((r) => [
    csvCell(r.fullName),
    csvCell(r.email),
    csvCell(r.phone),
    csvCell(r.country),
    csvCell(r.organization),
    csvCell(CATEGORY_LABELS[r.category] ?? r.category),
    csvCell(r.track),
    csvCell(r.confirmationCode),
    csvCell(new Date(r.submittedAt).toLocaleDateString('ar')),
  ]);

  const csv = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="registrations.csv"',
    },
  });
}
