'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';

type ActionResult = { error?: string } | void;

export async function createEdition(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const year = String(formData.get('year') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const descriptionAr = String(formData.get('descriptionAr') || '').trim();
  const descriptionEn = String(formData.get('descriptionEn') || '').trim();
  const descriptionTr = String(formData.get('descriptionTr') || '').trim();
  const attendees = String(formData.get('attendees') || '').trim();
  const speakersCount = String(formData.get('speakersCount') || '').trim();

  if (!year) return { error: 'السنة مطلوبة' };
  if (!titleAr) return { error: 'العنوان مطلوب' };

  const count = await prisma.historyEdition.count();
  await prisma.historyEdition.create({
    data: {
      year,
      titleAr, titleEn: titleEn || null, titleTr: titleTr || null,
      descriptionAr: descriptionAr || null, descriptionEn: descriptionEn || null, descriptionTr: descriptionTr || null,
      attendees: attendees || null,
      speakersCount: speakersCount || null,
      order: count,
    },
  });

  revalidatePath('/history');
  redirect('/admin/history');
}

export async function updateEdition(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const year = String(formData.get('year') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const descriptionAr = String(formData.get('descriptionAr') || '').trim();
  const descriptionEn = String(formData.get('descriptionEn') || '').trim();
  const descriptionTr = String(formData.get('descriptionTr') || '').trim();
  const attendees = String(formData.get('attendees') || '').trim();
  const speakersCount = String(formData.get('speakersCount') || '').trim();

  if (!year) return { error: 'السنة مطلوبة' };
  if (!titleAr) return { error: 'العنوان مطلوب' };

  const existing = await prisma.historyEdition.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  await prisma.historyEdition.update({
    where: { id },
    data: {
      year,
      titleAr, titleEn: titleEn || null, titleTr: titleTr || null,
      descriptionAr: descriptionAr || null, descriptionEn: descriptionEn || null, descriptionTr: descriptionTr || null,
      attendees: attendees || null,
      speakersCount: speakersCount || null,
    },
  });

  revalidatePath('/history');
  redirect('/admin/history');
}

export async function deleteEdition(id: string): Promise<void> {
  await prisma.historyEdition.delete({ where: { id } });
  revalidatePath('/history');
  revalidatePath('/admin/history');
}
