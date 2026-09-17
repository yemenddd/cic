import FormShell from '@/components/admin/FormShell';
import { LocaleTextField, ImageUploadField } from '@/components/admin/fields';
import { createGalleryImage } from '../actions';

export default function NewGalleryImagePage() {
  return (
    <FormShell title="إضافة صورة" backHref="/admin/gallery" action={createGalleryImage}>
      <ImageUploadField name="image" label="الصورة" />
      <LocaleTextField namePrefix="caption" label="الوصف" />
    </FormShell>
  );
}
