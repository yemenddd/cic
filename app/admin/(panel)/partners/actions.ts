'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { uploadImage, deleteImage } from '@/lib/blob';

type ActionResult = { error?: string } | void;

async function resolveLogoUrl(formData: FormData, currentUrl?: string): Promise<string | undefined> {
  const file = formData.get('logo') as File | null;
  if (file && file.size > 0) return uploadImage(file, 'partners');
  return currentUrl;
}

export async function createPartner(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!name) return { error: 'الاسم مطلوب' };

  const logoUrl = await resolveLogoUrl(formData);
  if (!logoUrl) return { error: 'الشعار مطلوب' };

  const count = await prisma.partner.count();
  await prisma.partner.create({ data: { name, url: url || null, logoUrl, order: count } });

  revalidatePath('/');
  redirect('/admin/partners');
}

export async function updatePartner(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') || '').trim();
  const url = String(formData.get('url') || '').trim();
  if (!name) return { error: 'الاسم مطلوب' };

  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) return { error: 'العنصر غير موجود' };

  const logoUrl = await resolveLogoUrl(formData, existing.logoUrl);

  await prisma.partner.update({ where: { id }, data: { name, url: url || null, logoUrl } });

  revalidatePath('/');
  redirect('/admin/partners');
}

export async function deletePartner(id: string): Promise<void> {
  const existing = await prisma.partner.findUnique({ where: { id } });
  if (existing) await deleteImage(existing.logoUrl);
  await prisma.partner.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin/partners');
}
