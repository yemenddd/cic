import Link from 'next/link';
import { Pencil, Users } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteEdition } from './actions';

export default async function AdminAchievementsPage() {
  const editions = await prisma.achievementEdition.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { students: true } } },
  });

  return (
    <div>
      <ListPageHeader title="الإنجازات" addHref="/admin/achievements/new" />
      <ListTable>
        <tbody>
          {editions.length === 0 && <EmptyRow colSpan={5} />}
          {editions.map((ed) => (
            <tr key={ed.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3 w-16" style={{ color: 'var(--text-tertiary)' }}>{ed.year}</td>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                {ed.titleAr || `الدورة ${ed.number}`}
              </td>
              <td className="p-3" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>{ed.slug}</td>
              <td className="p-3 w-28">
                <Link
                  href={`/admin/achievements/${ed.id}/students`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                  style={{ color: 'var(--text-secondary)', background: 'var(--mat-liquid-bg)' }}
                >
                  <Users className="h-3.5 w-3.5" />
                  {ed._count.students}
                </Link>
              </td>
              <td className="p-3 w-24">
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/admin/achievements/${ed.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton action={deleteEdition.bind(null, ed.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
