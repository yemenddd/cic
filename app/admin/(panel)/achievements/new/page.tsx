import FormShell from '@/components/admin/FormShell';
import { TextField, LocaleTextField } from '@/components/admin/fields';
import { createEdition } from '../actions';

export default function NewAchievementEditionPage() {
  return (
    <FormShell title="إضافة دورة" backHref="/admin/achievements" action={createEdition}>
      <TextField name="slug" label="المعرّف (بالإنجليزية)" dir="ltr" required />
      <TextField name="number" label="رقم الدورة" type="number" required />
      <TextField name="year" label="السنة" required />
      <LocaleTextField namePrefix="title" label="العنوان" />
    </FormShell>
  );
}
