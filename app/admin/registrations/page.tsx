import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteRegistration } from './actions';

const CATEGORY_LABELS: Record<string, string> = {
  visitor: 'زائر',
  participant: 'مشارك',
  volunteer: 'متطوع',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const registrations = await prisma.registration.findMany({
    where: query
      ? {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <div>
      <ListPageHeader title="التسجيلات" />

      <div className="flex items-center gap-3 mb-4">
        <form method="GET" className="flex-1">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            className="input-glass"
          />
        </form>
        <a
          href="/admin/registrations/export"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#0d0d0f' }}
        >
          تصدير CSV
        </a>
      </div>

      <ListTable>
        <tbody>
          {registrations.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={query ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد تسجيلات بعد'}
            />
          )}
          {registrations.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>{r.fullName}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }} dir="ltr">{r.phone || '—'}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{r.country || '—'}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{CATEGORY_LABELS[r.category] ?? r.category}</td>
              <td className="p-3 w-28" style={{ color: 'var(--text-tertiary)' }}>{new Date(r.submittedAt).toLocaleDateString('ar')}</td>
              <td className="p-3 w-16">
                <div className="flex items-center justify-end">
                  <DeleteButton action={deleteRegistration.bind(null, r.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
