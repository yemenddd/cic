import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField } from '@/components/admin/fields';
import { updateEdition } from '../actions';

export default async function EditEditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edition = await prisma.historyEdition.findUnique({ where: { id } });
  if (!edition) notFound();

  const action = updateEdition.bind(null, id);

  return (
    <FormShell title="تعديل دورة" backHref="/admin/history" action={action}>
      <TextField name="year" label="السنة" defaultValue={edition.year} required />
      <LocaleTextField
        namePrefix="title"
        label="العنوان"
        defaultValue={{ ar: edition.titleAr, en: edition.titleEn, tr: edition.titleTr }}
        required
      />
      <LocaleTextField
        namePrefix="description"
        label="الوصف"
        defaultValue={{ ar: edition.descriptionAr, en: edition.descriptionEn, tr: edition.descriptionTr }}
        multiline
      />
      <TextField name="attendees" label="عدد الحضور" defaultValue={edition.attendees} />
      <TextField name="speakersCount" label="عدد المتحدثين" defaultValue={edition.speakersCount} />
    </FormShell>
  );
}
