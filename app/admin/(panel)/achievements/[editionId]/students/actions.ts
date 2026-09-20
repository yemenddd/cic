'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { checkUpload, uploadImage, deleteImage } from '@/lib/blob';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';

type ActionResult = { error?: string } | void;

const PHOTO_SLOTS = 3;

function parseMembers(formData: FormData): string[] {
  const raw = String(formData.get('members') || '');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function resolvePhotoUrls(
  formData: FormData,
  currentUrls: string[] = [],
): Promise<{ urls: string[] } | { error: string }> {
  const urls: (string | undefined)[] = [];

  for (let i = 0; i < PHOTO_SLOTS; i++) {
    const file = formData.get(`photos_${i}`) as File | null;
    if (file && file.size > 0) {
      // Every slot is checked before anything is uploaded, so one bad file in
      // slot three does not leave the first two already stored.
      const problem = checkUpload(file);
      if (problem) return { error: `الصورة ${i + 1}: ${problem}` };
      urls.push(await uploadImage(file, 'achievements'));
    } else {
      urls.push(currentUrls[i]);
    }
  }

  return { urls: urls.filter((u): u is string => Boolean(u)) };
}

async function revalidateEdition(editionId: string) {
  const edition = await prisma.achievementEdition.findUnique({ where: { id: editionId } });
  if (edition) {
    revalidatePath(`/achievements/${edition.slug}`);
  }
  revalidatePath('/achievements/[edition]', 'page');
}

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

export async function createStudent(editionId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const studentId = String(formData.get('studentId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const projectTitleAr = String(formData.get('projectTitleAr') || '').trim();
  const projectTitleEn = String(formData.get('projectTitleEn') || '').trim();
  const projectTitleTr = String(formData.get('projectTitleTr') || '').trim();
  const role = String(formData.get('role') || '').trim();
  const videoId = String(formData.get('videoId') || '').trim();
  const color = String(formData.get('color') || '').trim();

  if (!studentId) return { error: 'معرّف الطالب مطلوب' };
  if (!name) return { error: 'الاسم مطلوب' };
  if (role !== 'innovator' && role !== 'participant') return { error: 'الدور مطلوب' };

  const edition = await prisma.achievementEdition.findUnique({ where: { id: editionId } });
  if (!edition) return { error: 'الدورة غير موجودة' };

  const members = parseMembers(formData);
  const photosResult = await resolvePhotoUrls(formData);
  if ('error' in photosResult) return { error: photosResult.error };
  const photoUrls = photosResult.urls;

  const count = await prisma.achievementStudent.count({ where: { editionId } });
  await prisma.achievementStudent.create({
    data: {
      editionId,
      studentId,
      name,
      members,
      projectTitleAr: projectTitleAr || null,
      projectTitleEn: projectTitleEn || null,
      projectTitleTr: projectTitleTr || null,
      role,
      photoUrls,
      videoId: videoId || null,
      color: color || null,
      order: count,
    },
  });

  await revalidateEdition(editionId);
  redirect(`/admin/achievements/${editionId}/students`);
}

export async function updateStudent(
  editionId: string,
  studentId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const studentCode = String(formData.get('studentId') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const projectTitleAr = String(formData.get('projectTitleAr') || '').trim();
  const projectTitleEn = String(formData.get('projectTitleEn') || '').trim();
  const projectTitleTr = String(formData.get('projectTitleTr') || '').trim();
  const role = String(formData.get('role') || '').trim();
  const videoId = String(formData.get('videoId') || '').trim();
  const color = String(formData.get('color') || '').trim();

  if (!studentCode) return { error: 'معرّف الطالب مطلوب' };
  if (!name) return { error: 'الاسم مطلوب' };
  if (role !== 'innovator' && role !== 'participant') return { error: 'الدور مطلوب' };

  const existing = await prisma.achievementStudent.findUnique({ where: { id: studentId } });
  if (!existing || existing.editionId !== editionId) return { error: 'العنصر غير موجود' };

  const members = parseMembers(formData);
  const photosResult = await resolvePhotoUrls(formData, existing.photoUrls);
  if ('error' in photosResult) return { error: photosResult.error };
  const photoUrls = photosResult.urls;

  await prisma.achievementStudent.update({
    where: { id: studentId },
    data: {
      studentId: studentCode,
      name,
      members,
      projectTitleAr: projectTitleAr || null,
      projectTitleEn: projectTitleEn || null,
      projectTitleTr: projectTitleTr || null,
      role,
      photoUrls,
      videoId: videoId || null,
      color: color || null,
    },
  });

  await revalidateEdition(editionId);
  redirect(`/admin/achievements/${editionId}/students`);
}

export async function deleteStudent(editionId: string, studentId: string): Promise<void> {
  await assertAdmin();
  const existing = await prisma.achievementStudent.findUnique({ where: { id: studentId } });
  if (existing) {
    for (const url of existing.photoUrls) {
      await deleteImage(url);
    }
  }
  await prisma.achievementStudent.delete({ where: { id: studentId } });

  await revalidateEdition(editionId);
  revalidatePath(`/admin/achievements/${editionId}/students`);
}
