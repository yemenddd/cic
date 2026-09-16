'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { REVIEW_STATUSES, isSubmissionStatus } from '@/lib/submissions';

type ActionResult = { error?: string; success?: string } | void;

// A Server Action is a POST to whatever route it is used on — proxy.ts guards
// the /admin page, but the action itself is the security boundary and must
// re-check the role on every call rather than trust the route it shipped with.
async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'ADMIN';
}

export async function reviewSubmission(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بمراجعة الابتكارات' };

  const status = String(formData.get('status') || '');
  // The attendee-owned statuses (DRAFT/PENDING) are not reachable from here.
  if (!isSubmissionStatus(status) || !REVIEW_STATUSES.includes(status)) {
    return { error: 'الحالة غير صالحة' };
  }

  const reviewNote = String(formData.get('reviewNote') || '').trim();
  if (status === 'REJECTED' && !reviewNote) {
    return { error: 'يرجى كتابة سبب الرفض ليظهر لصاحب المشروع' };
  }

  const { count } = await prisma.projectSubmission.updateMany({
    where: { id },
    data: { status, reviewNote: reviewNote || null, reviewedAt: new Date() },
  });
  if (count === 0) return { error: 'المشروع غير موجود' };

  revalidatePath('/admin/submissions');
  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath('/dashboard/innovations');

  return { success: 'تم حفظ قرار اللجنة' };
}
