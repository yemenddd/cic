import FormShell from '@/components/admin/FormShell';
import { LocaleTextField, ImageUploadField } from '@/components/admin/fields';
import { createSpeaker } from '../actions';

export default function NewSpeakerPage() {
  return (
    <FormShell title="إضافة متحدث" backHref="/admin/speakers" action={createSpeaker}>
      <LocaleTextField namePrefix="name" label="الاسم" required />
      <LocaleTextField namePrefix="role" label="المنصب" required />
      <LocaleTextField namePrefix="organization" label="الجهة" />
      <LocaleTextField namePrefix="topic" label="الموضوع" />
      <LocaleTextField namePrefix="bio" label="نبذة" multiline />
      <ImageUploadField name="photo" label="الصورة" />
    </FormShell>
  );
}
