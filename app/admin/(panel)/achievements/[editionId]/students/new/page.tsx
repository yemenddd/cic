import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import {
  TextField,
  TextAreaField,
  LocaleTextField,
  SelectField,
  ImageListUploadField,
} from '@/components/admin/fields';
import { createStudent } from '../actions';

const ROLE_OPTIONS = [
  { value: 'innovator', label: 'مبتكر' },
  { value: 'participant', label: 'مشارك' },
];

export default async function NewAchievementStudentPage({
  params,
}: {
  params: Promise<{ editionId: string }>;
}) {
  const { editionId } = await params;
  const edition = await prisma.achievementEdition.findUnique({ where: { id: editionId } });
  if (!edition) notFound();

  const action = createStudent.bind(null, editionId);

  return (
    <FormShell title="إضافة طالب" backHref={`/admin/achievements/${editionId}/students`} action={action}>
      <TextField name="studentId" label="معرّف الطالب" dir="ltr" required />
      <TextField name="name" label="الاسم" required />
      <TextAreaField name="members" label="أعضاء الفريق (سطر لكل اسم)" />
      <LocaleTextField namePrefix="projectTitle" label="عنوان المشروع" />
      <SelectField name="role" label="الدور" options={ROLE_OPTIONS} required />
      <TextField name="videoId" label="معرّف فيديو يوتيوب" dir="ltr" />
      <TextField name="color" label="اللون" dir="ltr" />
      <ImageListUploadField name="photos" label="الصور" max={3} />
    </FormShell>
  );
}
