import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteSession } from './actions';

const DAY_LABELS: Record<string, string> = {
  dayOne: 'اليوم الأول',
  dayTwo: 'اليوم الثاني',
};

export default async function AdminProgramPage() {
  const sessions = await prisma.programSession.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] });
  const dayOne = sessions.filter((s) => s.day === 'dayOne');
  const dayTwo = sessions.filter((s) => s.day === 'dayTwo');

  return (
    <div>
      <ListPageHeader title="البرنامج" addHref="/admin/program/new" />

      {[
        { key: 'dayOne', rows: dayOne },
        { key: 'dayTwo', rows: dayTwo },
      ].map(({ key, rows }) => (
        <div key={key} className="mb-8">
          <h2 className="font-outfit font-semibold text-[15px] mb-3" style={{ color: 'var(--text-primary)' }}>
            {DAY_LABELS[key]}
          </h2>
          <ListTable>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={4} />}
              {rows.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
                  <td className="p-3 w-20" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>{s.time}</td>
                  <td className="p-3" style={{ color: 'var(--text-primary)' }}>{s.titleAr}</td>
                  <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{s.speakerNameAr}</td>
                  <td className="p-3 w-24">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/admin/program/${s.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton action={deleteSession.bind(null, s.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ListTable>
        </div>
      ))}
    </div>
  );
}
