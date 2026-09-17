'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';

type ActionResult = { error?: string } | void;

export async function createVideo(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const section = String(formData.get('section') || '').trim();
  const editionLabelAr = String(formData.get('editionLabelAr') || '').trim();
  const editionLabelEn = String(formData.get('editionLabelEn') || '').trim();
  const editionLabelTr = String(formData.get('editionLabelTr') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const videoId = String(formData.get('videoId') || '').trim();

  if (!section) return { error: 'القسم مطلوب' };
  if (!titleAr) return { error: 'العنوان مطلوب' };
  if (!videoId) return { error: 'معرّف فيديو يوتيوب مطلوب' };

  const count = await prisma.video.count({ where: { section } });
  await prisma.video.create({
    data: {
      section,
      editionLabelAr: editionLabelAr || null,
      editionLabelEn: editionLabelEn || null,
      editionLabelTr: editionLabelTr || null,
      titleAr,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
      videoId,
      order: count,
    },
  });

  revalidatePath('/videos');
  redirect('/admin/videos');
}

export async function updateVideo(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const section = String(formData.get('section') || '').trim();
  const editionLabelAr = String(formData.get('editionLabelAr') || '').trim();
  const editionLabelEn = String(formData.get('editionLabelEn') || '').trim();
  const editionLabelTr = String(formData.get('editionLabelTr') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const videoId = String(formData.get('videoId') || '').trim();

  if (!section) return { error: 'القسم مطلوب' };
  if (!titleAr) return { error: 'العنوان مطلوب' };
  if (!videoId) return { error: 'معرّف فيديو يوتيوب مطلوب' };

  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  await prisma.video.update({
    where: { id },
    data: {
      section,
      editionLabelAr: editionLabelAr || null,
      editionLabelEn: editionLabelEn || null,
      editionLabelTr: editionLabelTr || null,
      titleAr,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
      videoId,
    },
  });

  revalidatePath('/videos');
  redirect('/admin/videos');
}

export async function deleteVideo(id: string): Promise<void> {
  await prisma.video.delete({ where: { id } });
  revalidatePath('/videos');
  revalidatePath('/admin/videos');
}
