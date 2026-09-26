import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField, SelectField, ImageUploadField } from '@/components/admin/fields';
import { updateSession } from '../actions';

const DAY_OPTIONS = [
  { value: 'dayOne', label: 'اليوم الأول' },
  { value: 'dayTwo', label: 'اليوم الثاني' },
];

export default async function EditProgramSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.programSession.findUnique({ where: { id } });
  if (!session) notFound();

  const action = updateSession.bind(null, id);

  return (
    <FormShell title="تعديل جلسة" backHref="/admin/program" action={action}>
      <SelectField name="day" label="اليوم" defaultValue={session.day} options={DAY_OPTIONS} required />
      <TextField name="time" label="الوقت" defaultValue={session.time} dir="ltr" required />
      <LocaleTextField
        namePrefix="title"
        label="العنوان"
        defaultValue={{ ar: session.titleAr, en: session.titleEn, tr: session.titleTr }}
        required
      />
      <LocaleTextField
        namePrefix="description"
        label="الوصف"
        defaultValue={{ ar: session.descriptionAr, en: session.descriptionEn, tr: session.descriptionTr }}
      />
      <LocaleTextField
        namePrefix="speakerName"
        label="اسم المتحدث"
        defaultValue={{ ar: session.speakerNameAr, en: session.speakerNameEn, tr: session.speakerNameTr }}
      />
      <LocaleTextField
        namePrefix="speakerRole"
        label="صفة المتحدث"
        defaultValue={{ ar: session.speakerRoleAr, en: session.speakerRoleEn, tr: session.speakerRoleTr }}
      />
      <ImageUploadField name="speakerPhoto" label="صورة المتحدث" currentUrl={session.speakerPhotoUrl} />
      <LocaleTextField
        namePrefix="track"
        label="المسار"
        defaultValue={{ ar: session.trackAr, en: session.trackEn, tr: session.trackTr }}
      />
      <TextField name="color" label="اللون" defaultValue={session.color} dir="ltr" />
    </FormShell>
  );
}
