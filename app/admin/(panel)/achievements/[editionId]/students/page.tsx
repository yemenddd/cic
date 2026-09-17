import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import ReorderButtons from '@/components/admin/ReorderButtons';
import { deleteStudent } from './actions';

const ROLE_LABELS: Record<string, string> = {
  innovator: 'مبتكر',
  participant: 'مشارك',
};

export default async function AdminAchievementStudentsPage({
  params,
}: {
  params: Promise<{ editionId: string }>;
}) {
  const { editionId } = await params;
  const edition = await prisma.achievementEdition.findUnique({ where: { id: editionId } });
  if (!edition) notFound();

  const students = await prisma.achievementStudent.findMany({
    where: { editionId },
    orderBy: { order: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/achievements" style={{ color: 'var(--text-tertiary)' }}>
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          {edition.titleAr || `الدورة ${edition.number}`} — {edition.year}
        </span>
      </div>
      <ListPageHeader title="طلاب الدورة" addHref={`/admin/achievements/${editionId}/students/new`} />
      <ListTable>
        <tbody>
          {students.length === 0 && <EmptyRow colSpan={6} />}
          {students.map((s, i) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="ps-3 w-8">
                <ReorderButtons
                  model="achievementStudent"
                  id={s.id}
                  isFirst={i === 0}
                  isLast={i === students.length - 1}
                />
              </td>
              <td className="p-3 w-16">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--mat-liquid-bg)' }}>
                  {s.photoUrls[0] && (
                    <Image src={s.photoUrls[0]} alt={s.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                  )}
                </div>
              </td>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{s.projectTitleAr}</td>
              <td className="p-3 w-24">
                <span
                  className="inline-block rounded-lg px-2 py-1 text-[12px]"
                  style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
                >
                  {ROLE_LABELS[s.role] ?? s.role}
                </span>
              </td>
              <td className="p-3 w-24">
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/admin/achievements/${editionId}/students/${s.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton action={deleteStudent.bind(null, editionId, s.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
