import FormShell from '@/components/admin/FormShell';
import { TextField, ImageUploadField } from '@/components/admin/fields';
import { createPartner } from '../actions';

export default function NewPartnerPage() {
  return (
    <FormShell title="إضافة شريك" backHref="/admin/partners" action={createPartner}>
      <TextField name="name" label="الاسم" required />
      <TextField name="url" label="الموقع الإلكتروني" type="url" dir="ltr" />
      <ImageUploadField name="logo" label="الشعار" />
    </FormShell>
  );
}
