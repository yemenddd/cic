'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { CATEGORIES } from '@/lib/categories';
import { AUDIENCE_ALL } from './audience';
import { deliverAnnouncement } from './send';

type ActionResult = { error?: string; success?: string } | void;

/** How many people each audience would reach, for the composer's preview. */
export async function audienceSizes(): Promise<Record<string, number>> {
  const counts = await prisma.user.groupBy({
    by: ['category'],
    where: { role: 'ATTENDEE' },
    _count: { _all: true },
  });

  const sizes: Record<string, number> = { [AUDIENCE_ALL]: 0 };
  for (const row of counts) {
    sizes[AUDIENCE_ALL] += row._count._all;
    if (row.category) sizes[row.category] = row._count._all;
  }
  for (const c of CATEGORIES) sizes[c.id] ??= 0;
  return sizes;
}

export async function sendAnnouncement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // This module is the security boundary; send.ts is the mechanism and has no
  // opinion about who is allowed to use it.
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بإرسال الإعلانات' };

  // A checkbox rather than a second page: the send is instant and cannot be
  // recalled, so it should take one deliberate extra click.
  if (formData.get('confirm') !== 'on') {
    return { error: 'أكّد الإرسال أولاً — لا يمكن التراجع عن الإعلان بعد إرساله' };
  }

  const result = await deliverAnnouncement(admin.id, {
    title: String(formData.get('title') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    link: String(formData.get('link') || '').trim(),
    audience: String(formData.get('audience') || ''),
  });

  if ('error' in result) return { error: result.error };

  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/notifications');

  return { success: `تم إرسال الإعلان إلى ${result.sent} مشارك` };
}
