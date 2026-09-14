import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField, SelectField } from '@/components/admin/fields';
import { createVideo } from '../actions';

const SECTION_OPTIONS = [
  { value: 'film', label: 'أفلام الدورات' },
  { value: 'tv', label: 'تلفزيون' },
];

export default function NewVideoPage() {
  return (
    <FormShell title="إضافة فيديو" backHref="/admin/videos" action={createVideo}>
      <SelectField name="section" label="القسم" options={SECTION_OPTIONS} required />
      <LocaleTextField namePrefix="editionLabel" label="اسم الدورة" />
      <LocaleTextField namePrefix="title" label="العنوان" required />
      <TextField name="videoId" label="معرّف فيديو يوتيوب" dir="ltr" required />
    </FormShell>
  );
}
