'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { sendEmail } from '@/lib/email';
import { approvalEmail, rejectionEmail } from '@/lib/account-emails';

type ActionResult = { error?: string; success?: string };

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';
const NOT_FOUND = 'الحساب غير موجود';

function revalidate() {
  revalidatePath('/admin/approvals');
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}

/**
 * Let somebody in.
 *
 * The notification is written in the same transaction as the decision. It is
 * the only thing that tells them the door has opened — they cannot sign in to
 * find out, which is the whole point of the queue — so a decision that is
 * recorded without one leaves somebody waiting for a message that never comes.
 */
export async function approveAccount(userId: string, note?: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, category: true, name: true, email: true },
  });
  if (!user) return { error: NOT_FOUND };
  if (user.status === 'APPROVED') return { success: 'هذا الحساب مقبول بالفعل' };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        status: 'APPROVED',
        statusNote: note?.trim() || null,
        statusChangedAt: new Date(),
      },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'تم قبول طلب انضمامك',
        body: note?.trim()
          || `أهلاً بك في مؤتمر CIC 2026 بصفة ${categoryLabel(user.category, 'ar') || 'مشارك'}. يمكنك الآن الدخول إلى حسابك.`,
        link: '/dashboard',
      },
    }),
  ]);

  // Sent after the decision is committed, and its result deliberately does not
  // change the outcome: the account is approved whether or not the mail
  // provider is reachable this second. Failing the approval because an API was
  // slow would be the worst of both — no decision and no message.
  const mail = await sendEmail({
    to: user.email,
    ...approvalEmail({ name: user.name, categoryLabel: categoryLabel(user.category, 'ar') }),
  });

  revalidate();
  return { success: approvedMessage(mail) };
}

/**
 * What the organizer is told about the mail.
 *
 * Said plainly rather than hidden: an organizer who believes a message went
 * out will not follow up by phone, and somebody added at the door has no
 * address to be followed up at.
 */
function approvedMessage(mail: Awaited<ReturnType<typeof sendEmail>>): string {
  if (mail.ok) return 'تم القبول وأُرسل إشعار إلى بريده';
  if (mail.reason === 'undeliverable') return 'تم القبول — لا بريد لهذا الحساب (أُضيف من الباب)';
  if (mail.reason === 'not-configured') return 'تم القبول — البريد غير مفعّل، والإشعار داخل المنصة فقط';
  return 'تم القبول — لكن تعذّر إرسال البريد، أبلغه بطريقة أخرى';
}

/**
 * Refuse an application.
 *
 * The note is required. A refusal with no reason is the version of this that
 * generates an email to the organizers asking why — and the person refused has
 * no way to know whether it was a mistake, a missing detail, or a decision.
 */
export async function rejectAccount(userId: string, note: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const reason = note.trim();
  if (!reason) return { error: 'اكتب سبب الرفض — يظهر لصاحب الحساب' };
  if (reason.length > 500) return { error: 'السبب طويل — اختصره إلى 500 حرف' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, name: true, email: true },
  });
  if (!user) return { error: NOT_FOUND };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: 'REJECTED', statusNote: reason, statusChangedAt: new Date() },
    }),
    prisma.notification.create({
      data: {
        userId,
        title: 'لم يُقبل طلب انضمامك',
        body: reason,
      },
    }),
  ]);

  // The one that matters most. A refusal notification lives inside the account
  // its recipient can no longer open, so without this the reason an organizer
  // sat down and typed reaches nobody until they try to sign in again.
  const mail = await sendEmail({
    to: user.email,
    ...rejectionEmail({ name: user.name, reason }),
  });

  revalidate();
  return {
    success: mail.ok
      ? 'تم الرفض وأُرسل السبب إلى بريده'
      : mail.reason === 'not-configured'
        ? 'تم الرفض — البريد غير مفعّل، ولن يعرف السبب إلا عند محاولة الدخول'
        : 'تم الرفض — تعذّر إرسال البريد، أبلغه بطريقة أخرى',
  };
}

/**
 * Put a decided account back in the queue.
 *
 * For the refusal that turns out to have been a mistake, and for revoking
 * access from an account that should not have it any more. Both are the same
 * write, and both take effect on the person's next request rather than when
 * their token expires — lib/auth-guards.ts re-reads the status every time.
 */
export async function resetToPending(userId: string): Promise<void> {
  await assertAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { status: 'PENDING', statusChangedAt: new Date() },
  });

  revalidate();
}
