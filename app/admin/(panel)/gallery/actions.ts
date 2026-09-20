'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { checkUpload, uploadImage, deleteImage } from '@/lib/blob';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';

type ActionResult = { error?: string } | void;

async function resolveImageUrl(
  formData: FormData,
  currentUrl?: string,
): Promise<{ url: string | undefined } | { error: string }> {
  const file = formData.get('image') as File | null;
  if (!file || file.size === 0) return { url: currentUrl };

  // Checked before the upload: refusing an oversized file should cost nothing,
  // and the reason should reach whoever tried.
  const problem = checkUpload(file);
  if (problem) return { error: problem };

  return { url: await uploadImage(file, 'gallery') };
}

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

export async function createGalleryImage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const captionAr = String(formData.get('captionAr') || '').trim();
  const captionEn = String(formData.get('captionEn') || '').trim();
  const captionTr = String(formData.get('captionTr') || '').trim();

  const imageUrlResult = await resolveImageUrl(formData);
  if ('error' in imageUrlResult) return { error: imageUrlResult.error };
  const imageUrl = imageUrlResult.url;
  if (!imageUrl) return { error: 'الصورة مطلوبة' };

  const count = await prisma.galleryImage.count();
  await prisma.galleryImage.create({
    data: {
      imageUrl,
      captionAr: captionAr || null,
      captionEn: captionEn || null,
      captionTr: captionTr || null,
      order: count,
    },
  });

  revalidatePath('/gallery');
  redirect('/admin/gallery');
}

export async function updateGalleryImage(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const captionAr = String(formData.get('captionAr') || '').trim();
  const captionEn = String(formData.get('captionEn') || '').trim();
  const captionTr = String(formData.get('captionTr') || '').trim();

  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const imageUrlResult = await resolveImageUrl(formData, existing.imageUrl);
  if ('error' in imageUrlResult) return { error: imageUrlResult.error };
  const imageUrl = imageUrlResult.url;
  if (!imageUrl) return { error: 'الصورة مطلوبة' };

  await prisma.galleryImage.update({
    where: { id },
    data: {
      imageUrl,
      captionAr: captionAr || null,
      captionEn: captionEn || null,
      captionTr: captionTr || null,
    },
  });

  revalidatePath('/gallery');
  redirect('/admin/gallery');
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await assertAdmin();
  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (existing) await deleteImage(existing.imageUrl);
  await prisma.galleryImage.delete({ where: { id } });
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}
