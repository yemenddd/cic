import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField } from '@/components/admin/fields';
import { createEdition } from '../actions';

export default function NewEditionPage() {
  return (
    <FormShell title="إضافة دورة" backHref="/admin/history" action={createEdition}>
      <TextField name="year" label="السنة" required />
      <LocaleTextField namePrefix="title" label="العنوان" required />
      <LocaleTextField namePrefix="description" label="الوصف" multiline />
      <TextField name="attendees" label="عدد الحضور" />
      <TextField name="speakersCount" label="عدد المتحدثين" />
    </FormShell>
  );
}
