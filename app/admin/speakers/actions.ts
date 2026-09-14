'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { uploadImage, deleteImage } from '@/lib/blob';

type ActionResult = { error?: string } | void;

async function resolvePhotoUrl(formData: FormData, currentUrl?: string | null): Promise<string | null> {
  const file = formData.get('photo') as File | null;
  if (file && file.size > 0) return uploadImage(file, 'speakers');
  return currentUrl ?? null;
}

export async function createSpeaker(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const nameAr = String(formData.get('nameAr') || '').trim();
  const nameEn = String(formData.get('nameEn') || '').trim();
  const nameTr = String(formData.get('nameTr') || '').trim();
  const roleAr = String(formData.get('roleAr') || '').trim();
  const roleEn = String(formData.get('roleEn') || '').trim();
  const roleTr = String(formData.get('roleTr') || '').trim();
  const organizationAr = String(formData.get('organizationAr') || '').trim();
  const organizationEn = String(formData.get('organizationEn') || '').trim();
  const organizationTr = String(formData.get('organizationTr') || '').trim();
  const topicAr = String(formData.get('topicAr') || '').trim();
  const topicEn = String(formData.get('topicEn') || '').trim();
  const topicTr = String(formData.get('topicTr') || '').trim();
  const bioAr = String(formData.get('bioAr') || '').trim();
  const bioEn = String(formData.get('bioEn') || '').trim();
  const bioTr = String(formData.get('bioTr') || '').trim();

  if (!nameAr) return { error: 'الاسم مطلوب' };
  if (!roleAr) return { error: 'المنصب مطلوب' };

  const photoUrl = await resolvePhotoUrl(formData);

  const count = await prisma.speaker.count();
  await prisma.speaker.create({
    data: {
      nameAr, nameEn: nameEn || null, nameTr: nameTr || null,
      roleAr, roleEn: roleEn || null, roleTr: roleTr || null,
      organizationAr: organizationAr || null, organizationEn: organizationEn || null, organizationTr: organizationTr || null,
      topicAr: topicAr || null, topicEn: topicEn || null, topicTr: topicTr || null,
      bioAr: bioAr || null, bioEn: bioEn || null, bioTr: bioTr || null,
      photoUrl,
      order: count,
    },
  });

  revalidatePath('/');
  redirect('/admin/speakers');
}

export async function updateSpeaker(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const nameAr = String(formData.get('nameAr') || '').trim();
  const nameEn = String(formData.get('nameEn') || '').trim();
  const nameTr = String(formData.get('nameTr') || '').trim();
  const roleAr = String(formData.get('roleAr') || '').trim();
  const roleEn = String(formData.get('roleEn') || '').trim();
  const roleTr = String(formData.get('roleTr') || '').trim();
  const organizationAr = String(formData.get('organizationAr') || '').trim();
  const organizationEn = String(formData.get('organizationEn') || '').trim();
  const organizationTr = String(formData.get('organizationTr') || '').trim();
  const topicAr = String(formData.get('topicAr') || '').trim();
  const topicEn = String(formData.get('topicEn') || '').trim();
  const topicTr = String(formData.get('topicTr') || '').trim();
  const bioAr = String(formData.get('bioAr') || '').trim();
  const bioEn = String(formData.get('bioEn') || '').trim();
  const bioTr = String(formData.get('bioTr') || '').trim();

  if (!nameAr) return { error: 'الاسم مطلوب' };
  if (!roleAr) return { error: 'المنصب مطلوب' };

  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const photoUrl = await resolvePhotoUrl(formData, existing.photoUrl);

  await prisma.speaker.update({
    where: { id },
    data: {
      nameAr, nameEn: nameEn || null, nameTr: nameTr || null,
      roleAr, roleEn: roleEn || null, roleTr: roleTr || null,
      organizationAr: organizationAr || null, organizationEn: organizationEn || null, organizationTr: organizationTr || null,
      topicAr: topicAr || null, topicEn: topicEn || null, topicTr: topicTr || null,
      bioAr: bioAr || null, bioEn: bioEn || null, bioTr: bioTr || null,
      photoUrl,
    },
  });

  revalidatePath('/');
  redirect('/admin/speakers');
}

export async function deleteSpeaker(id: string): Promise<void> {
  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (existing?.photoUrl) await deleteImage(existing.photoUrl);
  await prisma.speaker.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin/speakers');
}
