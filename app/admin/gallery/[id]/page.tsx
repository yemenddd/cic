import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { LocaleTextField, ImageUploadField } from '@/components/admin/fields';
import { updateGalleryImage } from '../actions';

export default async function EditGalleryImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) notFound();

  const action = updateGalleryImage.bind(null, id);

  return (
    <FormShell title="تعديل صورة" backHref="/admin/gallery" action={action}>
      <ImageUploadField name="image" label="الصورة" currentUrl={image.imageUrl} />
      <LocaleTextField
        namePrefix="caption"
        label="الوصف"
        defaultValue={{ ar: image.captionAr, en: image.captionEn, tr: image.captionTr }}
      />
    </FormShell>
  );
}
