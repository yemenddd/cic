import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import FormShell from '@/components/admin/FormShell';
import { TextField, ImageUploadField } from '@/components/admin/fields';
import { updatePartner } from '../actions';

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) notFound();

  const action = updatePartner.bind(null, id);

  return (
    <FormShell title="تعديل شريك" backHref="/admin/partners" action={action}>
      <TextField name="name" label="الاسم" defaultValue={partner.name} required />
      <TextField name="url" label="الموقع الإلكتروني" type="url" defaultValue={partner.url} dir="ltr" />
      <ImageUploadField name="logo" label="الشعار" currentUrl={partner.logoUrl} />
    </FormShell>
  );
}
