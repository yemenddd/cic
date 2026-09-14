import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteEdition } from './actions';

export default async function AdminHistoryPage() {
  const editions = await prisma.historyEdition.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <ListPageHeader title="رحلتنا" addHref="/admin/history/new" />
      <ListTable>
        <tbody>
          {editions.length === 0 && <EmptyRow colSpan={4} />}
          {editions.map((e) => (
            <tr key={e.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3 w-20" style={{ color: 'var(--text-primary)' }}>{e.year}</td>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>{e.titleAr}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{e.attendees}</td>
              <td className="p-3 w-24">
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/admin/history/${e.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton action={deleteEdition.bind(null, e.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
