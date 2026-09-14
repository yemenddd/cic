import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField, SelectField, ImageUploadField } from '@/components/admin/fields';
import { createSession } from '../actions';

const DAY_OPTIONS = [
  { value: 'dayOne', label: 'اليوم الأول' },
  { value: 'dayTwo', label: 'اليوم الثاني' },
];

export default function NewProgramSessionPage() {
  return (
    <FormShell title="إضافة جلسة" backHref="/admin/program" action={createSession}>
      <SelectField name="day" label="اليوم" options={DAY_OPTIONS} required />
      <TextField name="time" label="الوقت" dir="ltr" required />
      <LocaleTextField namePrefix="title" label="العنوان" required />
      <LocaleTextField namePrefix="speakerName" label="اسم المتحدث" />
      <LocaleTextField namePrefix="speakerRole" label="صفة المتحدث" />
      <ImageUploadField name="speakerPhoto" label="صورة المتحدث" />
      <LocaleTextField namePrefix="track" label="المسار" />
      <TextField name="color" label="اللون" dir="ltr" />
    </FormShell>
  );
}
