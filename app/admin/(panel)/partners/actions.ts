'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { checkUpload, uploadImage, deleteImage } from '@/lib/blob';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';

type ActionResult = { error?: string } | void;

async function resolveLogoUrl(
  formData: FormData,
  currentUrl?: string,
): Promise<{ url: string | undefined } | { error: string }> {
  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) return { url: currentUrl };

  // Checked before the upload: refusing an oversized file should cost nothing,
  // and the reason should reach whoever tried.
  const problem = checkUpload(file);
  if (problem) return { error: problem };

  return { url: await uploadImage(file, 'partners') };
}

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

export async function createPartner(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const name = String(formData.get('name') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!name) return { error: 'الاسم مطلوب' };

  const logoUrlResult = await resolveLogoUrl(formData);
  if ('error' in logoUrlResult) return { error: logoUrlResult.error };
  const logoUrl = logoUrlResult.url;
  if (!logoUrl) return { error: 'الشعار مطلوب' };

  const count = await prisma.partner.count();
  await prisma.partner.create({ data: { name, url: url || null, logoUrl, order: count } });

  revalidatePath('/');
  redirect('/admin/partners');
}

export async function updatePartner(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };
  const name = String(formData.get('name') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!name) return { error: 'الاسم مطلوب' };

  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const logoUrlResult = await resolveLogoUrl(formData, existing.logoUrl);
  if ('error' in logoUrlResult) return { error: logoUrlResult.error };
  const logoUrl = logoUrlResult.url;

  await prisma.partner.update({ where: { id }, data: { name, url: url || null, logoUrl } });

  revalidatePath('/');
  redirect('/admin/partners');
}

export async function deletePartner(id: string): Promise<void> {
  await assertAdmin();
  const existing = await prisma.partner.findUnique({ where: { id } });
  if (existing) await deleteImage(existing.logoUrl);
  await prisma.partner.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin/partners');
}
