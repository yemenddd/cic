import Link from 'next/link';
import { Eye } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import { categoryLabel } from '@/lib/categories';
import RoleChip from './RoleChip';

interface Props {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    // Admins first, then newest signups — the handful of accounts that can
    // change anything should never be buried under a page of attendees.
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { submissions: true, savedSessions: true } } },
  });

  return (
    <div>
      <ListPageHeader title="المستخدمون" />

      <form method="GET" className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          className="input-glass"
        />
      </form>

      <ListTable>
        <tbody>
          {users.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={query ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد مستخدمون بعد'}
            />
          )}
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                {u.name || '—'}
              </td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }} dir="ltr">
                {u.email}
              </td>
              <td className="p-3 w-24">
                <RoleChip role={u.role} />
              </td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                {categoryLabel(u.category, 'ar') || '—'}
              </td>
              <td className="p-3 w-40" style={{ color: 'var(--text-tertiary)' }}>
                {u._count.submissions} ابتكار · {u._count.savedSessions} جلسة
              </td>
              <td className="p-3 w-28" style={{ color: 'var(--text-tertiary)' }}>
                {new Date(u.createdAt).toLocaleDateString('ar')}
              </td>
              <td className="p-3 w-16">
                <div className="flex items-center justify-end">
                  <Link
                    href={`/admin/users/${u.id}`}
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
