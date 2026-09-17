import Image from 'next/image';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import ReorderButtons from '@/components/admin/ReorderButtons';
import { deleteGalleryImage } from './actions';

export default async function AdminGalleryPage() {
  const images = await prisma.galleryImage.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <ListPageHeader title="معرض الصور" addHref="/admin/gallery/new" />
      {images.length === 0 ? (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <table className="w-full text-[13.5px]">
            <tbody>
              <EmptyRow colSpan={1} />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden aspect-square"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <Image
                src={img.imageUrl}
                alt={img.captionAr ?? ''}
                fill
                unoptimized
                className="object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.55)' }}
              >
                <Link
                  href={`/admin/gallery/${img.id}`}
                  className="p-2 rounded-lg"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <div className="p-2 rounded-lg" style={{ background: 'var(--primary)' }}>
                  <DeleteButton action={deleteGalleryImage.bind(null, img.id)} />
                </div>
                {/* Pinned to the start edge so the compact chevron stack never
                    crowds the edit/delete pair on the smallest thumbnails. */}
                <div
                  className="absolute start-1.5 top-1/2 -translate-y-1/2 rounded-lg"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
                >
                  <ReorderButtons
                    model="galleryImage"
                    id={img.id}
                    isFirst={i === 0}
                    isLast={i === images.length - 1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
