import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { LocaleTextField, ImageUploadField } from '@/components/admin/fields';
import { updateSpeaker } from '../actions';

export default async function EditSpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const speaker = await prisma.speaker.findUnique({ where: { id } });
  if (!speaker) notFound();

  const action = updateSpeaker.bind(null, id);

  return (
    <FormShell title="تعديل متحدث" backHref="/admin/speakers" action={action}>
      <LocaleTextField
        namePrefix="name"
        label="الاسم"
        defaultValue={{ ar: speaker.nameAr, en: speaker.nameEn, tr: speaker.nameTr }}
        required
      />
      <LocaleTextField
        namePrefix="role"
        label="المنصب"
        defaultValue={{ ar: speaker.roleAr, en: speaker.roleEn, tr: speaker.roleTr }}
        required
      />
      <LocaleTextField
        namePrefix="organization"
        label="الجهة"
        defaultValue={{ ar: speaker.organizationAr, en: speaker.organizationEn, tr: speaker.organizationTr }}
      />
      <LocaleTextField
        namePrefix="topic"
        label="الموضوع"
        defaultValue={{ ar: speaker.topicAr, en: speaker.topicEn, tr: speaker.topicTr }}
      />
      <LocaleTextField
        namePrefix="bio"
        label="نبذة"
        defaultValue={{ ar: speaker.bioAr, en: speaker.bioEn, tr: speaker.bioTr }}
        multiline
      />
      <ImageUploadField name="photo" label="الصورة" currentUrl={speaker.photoUrl} />
    </FormShell>
  );
}
