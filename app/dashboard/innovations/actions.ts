'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { uploadImage } from '@/lib/blob';
import { canSubmitInnovations } from '@/lib/categories';

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

const SESSION_EXPIRED = 'انتهت الجلسة، سجّل الدخول مرة أخرى';
const NOT_FOUND = 'المشروع غير موجود';
const LOCKED = 'لا يمكن تعديل المشروع بعد إرساله إلى لجنة المراجعة';
const NOT_ENTITLED = 'تقديم الابتكارات متاح لفئة "مشارك" فقط';

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

async function resolveCoverUrl(formData: FormData, currentUrl?: string | null): Promise<string | null> {
  const file = formData.get('cover') as File | null;
  if (file && file.size > 0) return uploadImage(file, 'submissions');
  return currentUrl ?? null;
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

  const coverImageUrl = await resolveCoverUrl(formData);

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
  const existing = await prisma.projectSubmission.findFirst({ where: { id, userId } });
  if (!existing) return { error: NOT_FOUND };
  if (existing.status !== 'DRAFT') return { error: LOCKED };

  const coverImageUrl = await resolveCoverUrl(formData, existing.coverImageUrl);

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
