'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { REVIEW_STATUSES, SUBMISSION_STATUS_LABELS, isSubmissionStatus } from '@/lib/submissions';
import type { SubmissionStatus } from '@prisma/client';

type ActionResult = { error?: string; success?: string } | void;

// The attendee-facing wording of a decision. Reuses SUBMISSION_STATUS_LABELS so
// the notification never names a status differently from the chip on the card.
function decisionNotification(
  status: SubmissionStatus,
  projectTitle: string,
  reviewNote: string
): { title: string; body: string } {
  const headline =
    status === 'APPROVED'
      ? 'تم قبول مشروعك 🎉'
      : status === 'REJECTED'
        ? 'قرار اللجنة: لم يُقبل مشروعك'
        : 'مشروعك قيد المراجعة';

  const lead =
    status === 'APPROVED'
      ? `تهانينا! قبلت لجنة التحكيم مشروع «${projectTitle}».`
      : status === 'REJECTED'
        ? `بعد المراجعة، لم تقبل اللجنة مشروع «${projectTitle}» هذه المرة.`
        : `بدأت لجنة التحكيم مراجعة مشروع «${projectTitle}».`;

  const body = [
    lead,
    `الحالة الآن: ${SUBMISSION_STATUS_LABELS[status]}.`,
    reviewNote ? `ملاحظات اللجنة: ${reviewNote}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { title: headline, body };
}

// A Server Action is a POST to whatever route it is used on — proxy.ts guards
// the /admin page, but the action itself is the security boundary and must
// re-check the role on every call rather than trust the route it shipped with.
async function isAdmin(): Promise<boolean> {
  // Database-backed, not the JWT — see lib/auth-guards.ts for why.
  return (await requireAdmin()) !== null;
}

export async function reviewSubmission(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: 'غير مصرح لك بمراجعة الابتكارات' };

  const status = String(formData.get('status') || '');
  // The attendee-owned statuses (DRAFT/PENDING) are not reachable from here.
  if (!isSubmissionStatus(status) || !REVIEW_STATUSES.includes(status)) {
    return { error: 'الحالة غير صالحة' };
  }

  const reviewNote = String(formData.get('reviewNote') || '').trim();
  if (status === 'REJECTED' && !reviewNote) {
    return { error: 'يرجى كتابة سبب الرفض ليظهر لصاحب المشروع' };
  }

  // One transaction: the decision and the attendee's notification either both
  // land or neither does — never a saved decision the owner is never told about,
  // and never a notification announcing a decision that failed to save.
  const saved = await prisma.$transaction(async (tx) => {
    const submission = await tx.projectSubmission.findUnique({
      where: { id },
      select: { userId: true, titleAr: true },
    });
    if (!submission) return false;

    await tx.projectSubmission.update({
      where: { id },
      data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() },
    });

    const { title, body } = decisionNotification(status, submission.titleAr, reviewNote);
    await tx.notification.create({
      data: {
        userId: submission.userId,
        title,
        body,
        link: '/dashboard/innovations',
        kind: 'SUBMISSION',
      },
    });

    return true;
  });

  if (!saved) return { error: 'المشروع غير موجود' };

  revalidatePath('/admin/submissions');
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath('/dashboard/innovations');
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');

  return { success: 'تم حفظ قرار اللجنة' };
}
