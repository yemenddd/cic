'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { CATEGORIES } from '@/lib/categories';
import { MAIL_ALL, MAIL_ATTENDED } from './audience';
import { deliverBlast } from './send';

type ActionResult = { error?: string; success?: string } | void;

/**
 * How many people each audience would reach, for the composer's preview.
 *
 * Counted the same way the sender selects — attendees with a real address —
 * so the number on the button is the number that will actually be written to,
 * not the number registered.
 */
export async function mailAudienceSizes(): Promise<Record<string, number>> {
  // Guarded like every other export here. It only returns counts, but this is
  // a public POST endpoint like the rest of them, and how many people are
  // registered in each tier is the organizers' business — a number a
  // competitor, or anyone at all, could otherwise read off the platform.
  if (!(await requireAdmin())) return {};

  const counts = await prisma.user.groupBy({
    by: ['category'],
    where: { role: 'ATTENDEE', NOT: { email: { endsWith: '.invalid' } } },
    _count: { _all: true },
  });

  const sizes: Record<string, number> = { [MAIL_ALL]: 0 };
  for (const row of counts) {
    sizes[MAIL_ALL] += row._count._all;
    if (row.category) sizes[row.category] = row._count._all;
  }
  for (const c of CATEGORIES) sizes[c.id] ??= 0;

  // Counted separately because it is a relation rather than a column: the
  // groupBy above cannot answer "has a row at any checkpoint".
  sizes[MAIL_ATTENDED] = await prisma.user.count({
    where: {
      role: 'ATTENDEE',
      attendance: { some: {} },
      NOT: { email: { endsWith: '.invalid' } },
    },
  });

  return sizes;
}

export async function sendBlast(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  // This module is the security boundary; send.ts is the mechanism and has no
  // opinion about who is allowed to use it.
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بإرسال الرسائل' };

  // One deliberate extra click. Unlike an announcement, mail cannot be
  // withdrawn — once the provider has it, it is in somebody's inbox.
  if (formData.get('confirm') !== 'on') {
    return { error: 'أكّد الإرسال أولاً — البريد لا يمكن سحبه بعد إرساله' };
  }

  const result = await deliverBlast(admin.id, {
    subject: String(formData.get('subject') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    audience: String(formData.get('audience') || ''),
    toEmail: String(formData.get('toEmail') || '').trim(),
    buttonLabel: String(formData.get('buttonLabel') || '').trim(),
    buttonHref: String(formData.get('buttonHref') || '').trim(),
  });

  if ('error' in result) return { error: result.error };

  revalidatePath('/admin/emails');

  // Every number, not just the good one. "وصلت إلى 40" when 60 were attempted
  // is the kind of half-report that sends somebody looking for a bug days
  // later; the parts that did not arrive are named here.
  const parts = [`وصلت الرسالة إلى ${result.delivered} مستلماً`];
  if (result.skipped) parts.push(`${result.skipped} بلا بريد صالح`);
  if (result.failed) parts.push(`${result.failed} تعذّر إرسالها`);

  return { success: parts.join(' · ') };
}
