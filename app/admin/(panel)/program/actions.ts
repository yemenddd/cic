'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { uploadImage, deleteImage } from '@/lib/blob';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';

type ActionResult = { error?: string } | void;

async function resolveSpeakerPhotoUrl(formData: FormData, currentUrl?: string | null): Promise<string | null> {
  const file = formData.get('speakerPhoto') as File | null;
  if (file && file.size > 0) return uploadImage(file, 'program');
  return currentUrl ?? null;
}

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

export async function createSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const day = String(formData.get('day') || '').trim();
  const time = String(formData.get('time') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const speakerNameAr = String(formData.get('speakerNameAr') || '').trim();
  const speakerNameEn = String(formData.get('speakerNameEn') || '').trim();
  const speakerNameTr = String(formData.get('speakerNameTr') || '').trim();
  const speakerRoleAr = String(formData.get('speakerRoleAr') || '').trim();
  const speakerRoleEn = String(formData.get('speakerRoleEn') || '').trim();
  const speakerRoleTr = String(formData.get('speakerRoleTr') || '').trim();
  const trackAr = String(formData.get('trackAr') || '').trim();
  const trackEn = String(formData.get('trackEn') || '').trim();
  const trackTr = String(formData.get('trackTr') || '').trim();
  const color = String(formData.get('color') || '').trim();

  if (!day) return { error: 'اليوم مطلوب' };
  if (!time) return { error: 'الوقت مطلوب' };
  if (!titleAr) return { error: 'العنوان مطلوب' };

  const speakerPhotoUrl = await resolveSpeakerPhotoUrl(formData);

  const count = await prisma.programSession.count({ where: { day } });
  await prisma.programSession.create({
    data: {
      day,
      time,
      titleAr,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
      speakerNameAr: speakerNameAr || null,
      speakerNameEn: speakerNameEn || null,
      speakerNameTr: speakerNameTr || null,
      speakerRoleAr: speakerRoleAr || null,
      speakerRoleEn: speakerRoleEn || null,
      speakerRoleTr: speakerRoleTr || null,
      speakerPhotoUrl,
      trackAr: trackAr || null,
      trackEn: trackEn || null,
      trackTr: trackTr || null,
      color: color || null,
      order: count,
    },
  });

  revalidatePath('/program');
  redirect('/admin/program');
}

export async function updateSession(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const day = String(formData.get('day') || '').trim();
  const time = String(formData.get('time') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();
  const speakerNameAr = String(formData.get('speakerNameAr') || '').trim();
  const speakerNameEn = String(formData.get('speakerNameEn') || '').trim();
  const speakerNameTr = String(formData.get('speakerNameTr') || '').trim();
  const speakerRoleAr = String(formData.get('speakerRoleAr') || '').trim();
  const speakerRoleEn = String(formData.get('speakerRoleEn') || '').trim();
  const speakerRoleTr = String(formData.get('speakerRoleTr') || '').trim();
  const trackAr = String(formData.get('trackAr') || '').trim();
  const trackEn = String(formData.get('trackEn') || '').trim();
  const trackTr = String(formData.get('trackTr') || '').trim();
  const color = String(formData.get('color') || '').trim();

  if (!day) return { error: 'اليوم مطلوب' };
  if (!time) return { error: 'الوقت مطلوب' };
  if (!titleAr) return { error: 'العنوان مطلوب' };

  const existing = await prisma.programSession.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const speakerPhotoUrl = await resolveSpeakerPhotoUrl(formData, existing.speakerPhotoUrl);

  await prisma.programSession.update({
    where: { id },
    data: {
      day,
      time,
      titleAr,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
      speakerNameAr: speakerNameAr || null,
      speakerNameEn: speakerNameEn || null,
      speakerNameTr: speakerNameTr || null,
      speakerRoleAr: speakerRoleAr || null,
      speakerRoleEn: speakerRoleEn || null,
      speakerRoleTr: speakerRoleTr || null,
      speakerPhotoUrl,
      trackAr: trackAr || null,
      trackEn: trackEn || null,
      trackTr: trackTr || null,
      color: color || null,
    },
  });

  revalidatePath('/program');
  redirect('/admin/program');
}

export async function deleteSession(id: string): Promise<void> {
  await assertAdmin();
  const existing = await prisma.programSession.findUnique({ where: { id } });
  if (existing?.speakerPhotoUrl) await deleteImage(existing.speakerPhotoUrl);
  await prisma.programSession.delete({ where: { id } });
  revalidatePath('/program');
  revalidatePath('/admin/program');
}
