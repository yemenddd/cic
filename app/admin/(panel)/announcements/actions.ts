'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { CATEGORIES } from '@/lib/categories';
import { AUDIENCE_ALL } from './audience';
import {
  deliverAnnouncement, editAnnouncement, deleteAnnouncement, resendAnnouncement,
} from './send';

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

  // A checkbox rather than a second page: the send reaches every recipient at
  // once, so it should take one deliberate extra click. It is no longer
  // irreversible — an announcement can be withdrawn below — but it is still
  // something several thousand people see.
  if (formData.get('confirm') !== 'on') {
    return { error: 'أكّد الإرسال أولاً — يصل الإعلان إلى كل من في الفئة فوراً' };
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

/** Every path an announcement is visible on. */
function refreshAnnouncementViews(): void {
  revalidatePath('/admin/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/notifications');
}

/**
 * Correct one that has already gone out.
 *
 * Guarded here, like every other action in this file — send.ts is the
 * mechanism and has no opinion about who may use it.
 */
export async function updateAnnouncement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الإعلانات' };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'الإعلان غير محدد' };

  const result = await editAnnouncement(id, {
    title: String(formData.get('title') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    link: String(formData.get('link') || '').trim(),
    // The audience is fixed at send time; editAnnouncement ignores it, and it
    // is passed only because validateAnnouncement checks the whole shape.
    audience: String(formData.get('audience') || ''),
  });

  if ('error' in result) return { error: result.error };

  refreshAnnouncementViews();
  return { success: `تم التعديل — وحُدِّث لدى ${result.sent} مستلم` };
}

/** Withdraw one, taking its copies in every feed with it. */
export async function removeAnnouncement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بحذف الإعلانات' };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'الإعلان غير محدد' };

  const result = await deleteAnnouncement(id);
  if ('error' in result) return { error: result.error };

  refreshAnnouncementViews();
  return { success: `حُذف الإعلان، وأُزيل من ${result.removed} إشعاراً` };
}

/** Send it to anybody in the audience who joined after it first went out. */
export async function sendToNewRecipients(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإرسال الإعلانات' };

  const id = String(formData.get('id') || '');
  if (!id) return { error: 'الإعلان غير محدد' };

  const result = await resendAnnouncement(id);
  if ('error' in result) return { error: result.error };

  refreshAnnouncementViews();
  return { success: `أُرسل إلى ${result.sent} مشاركاً جديداً` };
}
