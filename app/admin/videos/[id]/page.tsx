import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField, SelectField } from '@/components/admin/fields';
import { updateVideo } from '../actions';

const SECTION_OPTIONS = [
  { value: 'film', label: 'أفلام الدورات' },
  { value: 'tv', label: 'تلفزيون' },
];

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) notFound();

  const action = updateVideo.bind(null, id);

  return (
    <FormShell title="تعديل فيديو" backHref="/admin/videos" action={action}>
      <SelectField name="section" label="القسم" defaultValue={video.section} options={SECTION_OPTIONS} required />
      <LocaleTextField
        namePrefix="editionLabel"
        label="اسم الدورة"
        defaultValue={{ ar: video.editionLabelAr, en: video.editionLabelEn, tr: video.editionLabelTr }}
      />
      <LocaleTextField
        namePrefix="title"
        label="العنوان"
        defaultValue={{ ar: video.titleAr, en: video.titleEn, tr: video.titleTr }}
        required
      />
      <TextField name="videoId" label="معرّف فيديو يوتيوب" defaultValue={video.videoId} dir="ltr" required />
    </FormShell>
  );
}
