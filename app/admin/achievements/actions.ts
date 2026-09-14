'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { deleteImage } from '@/lib/blob';

type ActionResult = { error?: string } | void;

const SLUG_RE = /^[a-z0-9-]+$/;

function revalidateAchievements() {
  revalidatePath('/achievements');
  revalidatePath('/achievements/[edition]', 'page');
}

export async function createEdition(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const slug = String(formData.get('slug') || '').trim();
  const numberRaw = String(formData.get('number') || '').trim();
  const year = String(formData.get('year') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();

  if (!slug) return { error: 'المعرّف مطلوب' };
  if (!SLUG_RE.test(slug)) return { error: 'المعرّف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط' };
  if (!numberRaw) return { error: 'الرقم مطلوب' };
  const number = Number(numberRaw);
  if (!Number.isFinite(number)) return { error: 'الرقم غير صالح' };
  if (!year) return { error: 'السنة مطلوبة' };

  const existing = await prisma.achievementEdition.findUnique({ where: { slug } });
  if (existing) return { error: 'هذا المعرّف مستخدم من قبل' };

  const count = await prisma.achievementEdition.count();
  await prisma.achievementEdition.create({
    data: {
      slug,
      number,
      year,
      titleAr: titleAr || null,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
      order: count,
    },
  });

  revalidateAchievements();
  redirect('/admin/achievements');
}

export async function updateEdition(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const slug = String(formData.get('slug') || '').trim();
  const numberRaw = String(formData.get('number') || '').trim();
  const year = String(formData.get('year') || '').trim();
  const titleAr = String(formData.get('titleAr') || '').trim();
  const titleEn = String(formData.get('titleEn') || '').trim();
  const titleTr = String(formData.get('titleTr') || '').trim();

  if (!slug) return { error: 'المعرّف مطلوب' };
  if (!SLUG_RE.test(slug)) return { error: 'المعرّف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط' };
  if (!numberRaw) return { error: 'الرقم مطلوب' };
  const number = Number(numberRaw);
  if (!Number.isFinite(number)) return { error: 'الرقم غير صالح' };
  if (!year) return { error: 'السنة مطلوبة' };

  const existing = await prisma.achievementEdition.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const conflict = await prisma.achievementEdition.findUnique({ where: { slug } });
  if (conflict && conflict.id !== id) return { error: 'هذا المعرّف مستخدم من قبل' };

  await prisma.achievementEdition.update({
    where: { id },
    data: {
      slug,
      number,
      year,
      titleAr: titleAr || null,
      titleEn: titleEn || null,
      titleTr: titleTr || null,
    },
  });

  revalidateAchievements();
  redirect('/admin/achievements');
}

export async function deleteEdition(id: string): Promise<void> {
  const students = await prisma.achievementStudent.findMany({ where: { editionId: id } });
  for (const student of students) {
    for (const url of student.photoUrls) {
      await deleteImage(url);
    }
  }

  // Deleting the edition cascades to its students (onDelete: Cascade in the schema).
  await prisma.achievementEdition.delete({ where: { id } });

  revalidateAchievements();
  revalidatePath('/admin/achievements');
}
