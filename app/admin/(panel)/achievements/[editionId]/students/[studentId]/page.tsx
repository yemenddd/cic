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
import { updateStudent } from '../actions';

const ROLE_OPTIONS = [
  { value: 'innovator', label: 'مبتكر' },
  { value: 'participant', label: 'مشارك' },
];

export default async function EditAchievementStudentPage({
  params,
}: {
  params: Promise<{ editionId: string; studentId: string }>;
}) {
  const { editionId, studentId } = await params;
  const student = await prisma.achievementStudent.findUnique({ where: { id: studentId } });
  if (!student || student.editionId !== editionId) notFound();

  const action = updateStudent.bind(null, editionId, studentId);

  return (
    <FormShell title="تعديل طالب" backHref={`/admin/achievements/${editionId}/students`} action={action}>
      <TextField name="studentId" label="معرّف الطالب" defaultValue={student.studentId} dir="ltr" required />
      <TextField name="name" label="الاسم" defaultValue={student.name} required />
      <TextAreaField name="members" label="أعضاء الفريق (سطر لكل اسم)" defaultValue={student.members.join('\n')} />
      <LocaleTextField
        namePrefix="projectTitle"
        label="عنوان المشروع"
        defaultValue={{ ar: student.projectTitleAr, en: student.projectTitleEn, tr: student.projectTitleTr }}
      />
      <SelectField name="role" label="الدور" options={ROLE_OPTIONS} defaultValue={student.role} required />
      <TextField name="videoId" label="معرّف فيديو يوتيوب" defaultValue={student.videoId} dir="ltr" />
      <TextField name="color" label="اللون" defaultValue={student.color} dir="ltr" />
      <ImageListUploadField name="photos" label="الصور" currentUrls={student.photoUrls} max={3} />
    </FormShell>
  );
}
