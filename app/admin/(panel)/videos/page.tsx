import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import ReorderButtons from '@/components/admin/ReorderButtons';
import { deleteVideo } from './actions';

const SECTION_LABELS: Record<string, string> = {
  film: 'أفلام الدورات',
  tv: 'تلفزيون',
};

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({ orderBy: [{ section: 'asc' }, { order: 'asc' }] });
  const film = videos.filter((v) => v.section === 'film');
  const tv = videos.filter((v) => v.section === 'tv');

  return (
    <div>
      <ListPageHeader title="الفيديوهات" addHref="/admin/videos/new" />

      {[
        { key: 'film', rows: film },
        { key: 'tv', rows: tv },
      ].map(({ key, rows }) => (
        <div key={key} className="mb-8">
          <h2 className="font-outfit font-semibold text-[15px] mb-3" style={{ color: 'var(--text-primary)' }}>
            {SECTION_LABELS[key]}
          </h2>
          <ListTable>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={4} />}
              {rows.map((v, i) => (
                <tr key={v.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
                  <td className="ps-3 w-8">
                    {/* Reordering is scoped to the section, so first/last are relative to this section's rows. */}
                    <ReorderButtons
                      model="video"
                      id={v.id}
                      isFirst={i === 0}
                      isLast={i === rows.length - 1}
                    />
                  </td>
                  <td className="p-3" style={{ color: 'var(--text-primary)' }}>{v.titleAr}</td>
                  <td className="p-3 w-48" dir="ltr">
                    <a
                      href={`https://youtube.com/watch?v=${v.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {v.videoId}
                    </a>
                  </td>
                  <td className="p-3 w-24">
                    <div className="flex items-center gap-1 justify-end">
                      <Link href={`/admin/videos/${v.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton action={deleteVideo.bind(null, v.id)} />
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
