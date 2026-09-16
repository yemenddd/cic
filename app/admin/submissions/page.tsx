import Link from 'next/link';
import { Eye } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import StatusChip from '@/components/submissions/StatusChip';
import { SUBMISSION_STATUSES, SUBMISSION_STATUS_LABELS, isSubmissionStatus } from '@/lib/submissions';

interface Props {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const active = status && isSubmissionStatus(status) ? status : null;

  const submissions = await prisma.projectSubmission.findMany({
    where: active ? { status: active } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  const filters = [
    { value: '', label: 'الكل' },
    ...SUBMISSION_STATUSES.map((s) => ({ value: s, label: SUBMISSION_STATUS_LABELS[s] })),
  ];

  return (
    <div>
      <ListPageHeader title="الابتكارات المقدَّمة" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const isActive = (active ?? '') === f.value;
          return (
            <Link
              key={f.value || 'all'}
              href={f.value ? `/admin/submissions?status=${f.value}` : '/admin/submissions'}
              className="rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={{
                background: isActive ? 'var(--primary)' : 'var(--mat-liquid-bg)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--text-secondary)',
                border: '1px solid var(--mat-liquid-border)',
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <ListTable>
        <tbody>
          {submissions.length === 0 && (
            <EmptyRow
              colSpan={5}
              label={active ? 'لا توجد ابتكارات بهذه الحالة' : 'لا توجد ابتكارات مقدَّمة بعد'}
            />
          )}
          {submissions.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                {s.titleAr}
                {s.track && (
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>{s.track}</span>
                )}
              </td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                {s.user.name || '—'}
                <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
                  {s.user.email}
                </span>
              </td>
              <td className="p-3 w-28">
                <StatusChip status={s.status} />
              </td>
              <td className="p-3 w-28" style={{ color: 'var(--text-tertiary)' }}>
                {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('ar') : '—'}
              </td>
              <td className="p-3 w-16">
                <div className="flex items-center justify-end">
                  <Link
                    href={`/admin/submissions/${s.id}`}
                    className="p-1.5 rounded-lg"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="عرض"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
