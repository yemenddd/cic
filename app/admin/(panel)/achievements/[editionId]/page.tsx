import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField } from '@/components/admin/fields';
import { updateEdition } from '../actions';

export default async function EditAchievementEditionPage({ params }: { params: Promise<{ editionId: string }> }) {
  const { editionId } = await params;
  const edition = await prisma.achievementEdition.findUnique({ where: { id: editionId } });
  if (!edition) notFound();

  const action = updateEdition.bind(null, editionId);

  return (
    <FormShell title="تعديل الدورة" backHref="/admin/achievements" action={action}>
      <TextField name="slug" label="المعرّف (بالإنجليزية)" defaultValue={edition.slug} dir="ltr" required />
      <TextField name="number" label="رقم الدورة" type="number" defaultValue={edition.number} required />
      <TextField name="year" label="السنة" defaultValue={edition.year} required />
      <LocaleTextField
        namePrefix="title"
        label="العنوان"
        defaultValue={{ ar: edition.titleAr, en: edition.titleEn, tr: edition.titleTr }}
      />
    </FormShell>
  );
}
