import Image from 'next/image';
import Link from 'next/link';
import { Pencil, User } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteSpeaker } from './actions';

export default async function AdminSpeakersPage() {
  const speakers = await prisma.speaker.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <ListPageHeader title="المتحدثون" addHref="/admin/speakers/new" />
      <ListTable>
        <tbody>
          {speakers.length === 0 && <EmptyRow colSpan={4} />}
          {speakers.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3 w-16">
                <div
                  className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--mat-liquid-bg)' }}
                >
                  {s.photoUrl
                    ? <Image src={s.photoUrl} alt={s.nameAr} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    : <User className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />}
                </div>
              </td>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>{s.nameAr}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{s.roleAr}</td>
              <td className="p-3 w-24">
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/admin/speakers/${s.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton action={deleteSpeaker.bind(null, s.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
