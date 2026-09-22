'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import {
  checkUpload, uploadImage, uploadDocument, checkDocumentUpload, deleteImage,
  MAX_FILES_PER_SUBMISSION, type StoredDocument,
} from '@/lib/blob';
import { canSubmitInnovations, MAX_SUBMISSIONS_PER_ATTENDEE } from '@/lib/categories';

type ActionResult = { error?: string; success?: string } | void;

// The owner id ALWAYS comes from the server-side session and is never accepted
// as a parameter. Every query below is scoped by it, so passing another
// attendee's submission id simply matches zero rows instead of leaking or
// mutating their project.
async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Presenting a project is a `participant` benefit (see lib/categories.ts).
// Hiding the nav link only tidies the UI — a server action is a public POST
// endpoint, so entitlement is re-checked here on every write. The category is
// read from the database rather than the JWT, so an admin changing someone's
// category takes effect immediately instead of when their token happens to
// refresh.
async function entitledUserId(): Promise<{ id: string } | { error: string }> {
  const id = await currentUserId();
  if (!id) return { error: SESSION_EXPIRED };

  const user = await prisma.user.findUnique({ where: { id }, select: { category: true } });
  if (!user) return { error: SESSION_EXPIRED };
  if (!canSubmitInnovations(user.category)) return { error: NOT_ENTITLED };

  return { id };
}

const TOO_MANY = `لا يمكن تقديم أكثر من ${MAX_SUBMISSIONS_PER_ATTENDEE} مشاريع من حساب واحد — احذف مشروعاً قديماً أولاً`;
const SESSION_EXPIRED = 'انتهت الجلسة، سجّل الدخول مرة أخرى';
const NOT_FOUND = 'المشروع غير موجود';
const LOCKED = 'لا يمكن تعديل المشروع بعد إرساله إلى لجنة المراجعة';
const NOT_ENTITLED = 'تقديم الأعمال متاح لفئة "مشارك" فقط';

// One name per line — same shape as the admin achievement students form.
function parseTeamMembers(formData: FormData): string[] {
  return String(formData.get('teamMembers') || '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function readFields(formData: FormData) {
  return {
    titleAr: String(formData.get('titleAr') || '').trim(),
    titleEn: String(formData.get('titleEn') || '').trim(),
    summaryAr: String(formData.get('summaryAr') || '').trim(),
    descriptionAr: String(formData.get('descriptionAr') || '').trim(),
    track: String(formData.get('track') || '').trim(),
    videoId: String(formData.get('videoId') || '').trim(),
  };
}

/**
 * The cover image, or the reason it was refused.
 *
 * Checked before the upload rather than after: an oversized file should cost
 * nothing to reject, and the attendee should be told what was wrong with it
 * rather than meeting a generic failure.
 */
async function resolveCoverUrl(
  formData: FormData,
  currentUrl?: string | null,
): Promise<{ url: string | null } | { error: string }> {
  const file = formData.get('cover') as File | null;
  if (!file || file.size === 0) return { url: currentUrl ?? null };

  const problem = checkUpload(file);
  if (problem) return { error: problem };

  return { url: await uploadImage(file, 'submissions') };
}

/**
 * The attached files, checked before any of them is stored.
 *
 * All-or-nothing: a batch where the fourth file is too large uploads nothing,
 * rather than leaving three paid-for blobs behind and reporting a failure. The
 * ceiling counts what is already attached, so adding two to an existing four
 * is refused rather than silently making six.
 */
async function resolveFiles(
  formData: FormData,
  existingCount: number,
): Promise<{ files: StoredDocument[] } | { error: string }> {
  const picked = formData
    .getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (picked.length === 0) return { files: [] };

  if (existingCount + picked.length > MAX_FILES_PER_SUBMISSION) {
    return {
      error: `لا يمكن إرفاق أكثر من ${MAX_FILES_PER_SUBMISSION} ملفات للمشروع الواحد`,
    };
  }

  for (const file of picked) {
    const problem = checkDocumentUpload(file);
    if (problem) return { error: problem };
  }

  return { files: await Promise.all(picked.map((f) => uploadDocument(f, 'submissions/files'))) };
}

function revalidate() {
  revalidatePath('/dashboard/innovations');
  revalidatePath('/dashboard');
  revalidatePath('/admin/submissions');
}

export async function createSubmission(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };
  const userId = me.id;

  const fields = readFields(formData);
  if (!fields.titleAr) return { error: 'عنوان المشروع مطلوب' };
  if (!fields.summaryAr) return { error: 'الملخص مطلوب' };

  // Checked BEFORE the cover is uploaded, not after. A server action is a
  // public POST endpoint, and this one had no ceiling at all: a signed-in
  // participant could create submissions in a loop, each one costing a Blob
  // upload that is never reclaimed and a row in the committee's review queue.
  // Refusing after the upload would stop the rows but still pay for the files.
  const existing = await prisma.projectSubmission.count({ where: { userId } });
  if (existing >= MAX_SUBMISSIONS_PER_ATTENDEE) return { error: TOO_MANY };

  const cover = await resolveCoverUrl(formData);
  if ('error' in cover) return { error: cover.error };
  const coverImageUrl = cover.url;

  const attached = await resolveFiles(formData, 0);
  if ('error' in attached) return { error: attached.error };

  await prisma.projectSubmission.create({
    data: {
      userId,
      titleAr: fields.titleAr,
      titleEn: fields.titleEn || null,
      summaryAr: fields.summaryAr,
      descriptionAr: fields.descriptionAr || null,
      track: fields.track || null,
      teamMembers: parseTeamMembers(formData),
      coverImageUrl,
      videoId: fields.videoId || null,
      files: { create: attached.files },
    },
  });

  revalidate();
  redirect('/dashboard/innovations');
}

export async function updateSubmission(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };
  const userId = me.id;

  const fields = readFields(formData);
  if (!fields.titleAr) return { error: 'عنوان المشروع مطلوب' };
  if (!fields.summaryAr) return { error: 'الملخص مطلوب' };

  // Scoped read: someone else's submission comes back as null, which is
  // indistinguishable from "does not exist" — no existence oracle either.
  const existing = await prisma.projectSubmission.findFirst({
    where: { id, userId },
    include: { _count: { select: { files: true } } },
  });
  if (!existing) return { error: NOT_FOUND };
  if (existing.status !== 'DRAFT') return { error: LOCKED };

  const cover = await resolveCoverUrl(formData, existing.coverImageUrl);
  if ('error' in cover) return { error: cover.error };
  const coverImageUrl = cover.url;

  const attached = await resolveFiles(formData, existing._count.files);
  if ('error' in attached) return { error: attached.error };

  // updateMany re-asserts owner AND status in the WHERE clause, so a review
  // that lands between the read above and this write cannot be overwritten.
  const { count } = await prisma.projectSubmission.updateMany({
    where: { id, userId, status: 'DRAFT' },
    data: {
      titleAr: fields.titleAr,
      titleEn: fields.titleEn || null,
      summaryAr: fields.summaryAr,
      descriptionAr: fields.descriptionAr || null,
      track: fields.track || null,
      teamMembers: parseTeamMembers(formData),
      coverImageUrl,
      videoId: fields.videoId || null,
    },
  });
  if (count === 0) return { error: LOCKED };

  // Written after the guarded update, and only if it applied: attaching files
  // to a submission the committee took mid-edit would put them on a project
  // its owner may no longer change.
  if (attached.files.length > 0) {
    await prisma.submissionFile.createMany({
      data: attached.files.map((f) => ({ ...f, submissionId: id })),
    });
  }

  revalidate();
  redirect('/dashboard/innovations');
}

export async function deleteSubmission(id: string): Promise<void> {
  const me = await entitledUserId();
  if ('error' in me) return;
  const userId = me.id;

  // deleteMany scoped to both ids: deletes nothing when the row belongs to
  // another attendee, and never throws when the row is already gone.
  await prisma.projectSubmission.deleteMany({ where: { id, userId } });

  revalidate();
}

/**
 * Remove one attached file.
 *
 * Scoped to the owner and to DRAFT: once the committee has it, the files are
 * part of what they are judging and their owner may not quietly take one away.
 * The blob goes with the row — an orphaned file is storage nobody can reach
 * and nobody stops paying for.
 */
export async function deleteSubmissionFile(fileId: string): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };

  const file = await prisma.submissionFile.findFirst({
    where: { id: fileId, submission: { userId: me.id, status: 'DRAFT' } },
    select: { id: true, url: true },
  });
  if (!file) return { error: 'تعذّر حذف الملف — تأكد أن المشروع ما زال مسودة' };

  await prisma.submissionFile.delete({ where: { id: file.id } });
  await deleteImage(file.url);

  revalidate();
  return { success: 'حُذف الملف' };
}

export async function submitForReview(id: string): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };
  const userId = me.id;

  // DRAFT is part of the WHERE clause, so re-submitting an already-sent
  // project (double click, stale tab) is a no-op rather than a reset of
  // submittedAt or of a decision the committee already made.
  const { count } = await prisma.projectSubmission.updateMany({
    where: { id, userId, status: 'DRAFT' },
    data: { status: 'PENDING', submittedAt: new Date() },
  });
  if (count === 0) return { error: 'تعذّر إرسال المشروع — تأكد أنه ما زال مسودة' };

  revalidate();
  return { success: 'تم إرسال المشروع إلى لجنة المراجعة' };
}
