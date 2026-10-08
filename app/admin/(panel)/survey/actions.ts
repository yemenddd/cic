'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { SETTINGS_ID } from '@/lib/site-settings';
import { SEED_QUESTIONS } from '@/lib/survey';
import type { SurveyQuestionKind } from '@prisma/client';

/**
 * Everything an organizer can do to the survey.
 *
 * This module is the security boundary — every export here proves the caller
 * is an admin before touching anything, because every export of a 'use server'
 * module is a public POST endpoint. The arithmetic lives in results.ts, which
 * has no opinion about who is asking.
 */

type ActionResult = { error?: string; success?: string } | void;

const KINDS: SurveyQuestionKind[] = ['RATING', 'SCALE_10', 'CHOICE', 'MULTI', 'TEXT'];

function refresh(): void {
  revalidatePath('/admin/survey');
  // The public form is rendered per request, but the path is revalidated too
  // so nothing downstream serves a stale question list.
  revalidatePath('/survey');
}

/** Options arrive as one per line — the only shape that survives Arabic commas. */
function parseOptions(raw: string): string[] {
  return [...new Set(raw.split('\n').map((o) => o.trim()).filter(Boolean))].slice(0, 40);
}

function validate(input: {
  section: string; promptAr: string; kind: SurveyQuestionKind; options: string[];
}): string | null {
  if (!input.section) return 'القسم مطلوب';
  if (input.section.length > 80) return 'اسم القسم طويل جداً';
  if (!input.promptAr) return 'نص السؤال مطلوب';
  if (input.promptAr.length > 300) return 'نص السؤال طويل جداً — 300 حرف كحد أقصى';
  if (!KINDS.includes(input.kind)) return 'نوع السؤال غير صالح';
  // A choice question with nothing to choose is a dead end on the form, and
  // the form cannot refuse it on the attendee's behalf.
  if ((input.kind === 'CHOICE' || input.kind === 'MULTI') && input.options.length < 2) {
    return 'سؤال الاختيار يحتاج خيارين على الأقل — سطر لكل خيار';
  }
  return null;
}

function read(form: FormData) {
  const kind = String(form.get('kind') || 'RATING') as SurveyQuestionKind;
  const options = KINDS.includes(kind) && (kind === 'CHOICE' || kind === 'MULTI')
    ? parseOptions(String(form.get('options') || ''))
    : [];
  return {
    section: String(form.get('section') || '').trim(),
    promptAr: String(form.get('promptAr') || '').trim(),
    helpAr: String(form.get('helpAr') || '').trim(),
    kind,
    options,
    required: form.get('required') === 'on',
  };
}

export async function addQuestion(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  const input = read(form);
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  // Appended rather than inserted: the order is the order on the form, and a
  // new question belongs at the end until somebody moves it.
  const last = await prisma.surveyQuestion.findFirst({
    orderBy: { order: 'desc' }, select: { order: true },
  });

  await prisma.surveyQuestion.create({
    data: {
      section: input.section,
      promptAr: input.promptAr,
      helpAr: input.helpAr || null,
      kind: input.kind,
      options: input.options,
      required: input.required,
      order: (last?.order ?? -1) + 1,
    },
  });

  refresh();
  return { success: 'أُضيف السؤال' };
}

export async function updateQuestion(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  const id = String(form.get('id') || '');
  if (!id) return { error: 'السؤال غير محدد' };

  const input = read(form);
  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const existing = await prisma.surveyQuestion.findUnique({
    where: { id },
    select: { kind: true, _count: { select: { answers: true } } },
  });
  if (!existing) return { error: 'السؤال غير موجود — ربما حُذف' };

  // Changing the kind of a question people have already answered would leave
  // ratings filed under a text question and a chart reading nothing. The
  // wording stays editable; the shape does not.
  if (existing._count.answers > 0 && existing.kind !== input.kind) {
    return { error: `لا يمكن تغيير نوع سؤال أُجيب عليه (${existing._count.answers} إجابة). أنشئ سؤالاً جديداً وأوقف هذا.` };
  }

  await prisma.surveyQuestion.update({
    where: { id },
    data: {
      section: input.section,
      promptAr: input.promptAr,
      helpAr: input.helpAr || null,
      kind: input.kind,
      options: input.options,
      required: input.required,
    },
  });

  refresh();
  return { success: 'حُفظ التعديل' };
}

/** Retire a question, or bring it back. Its answers are untouched either way. */
export async function setQuestionActive(id: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };
  if (!id) return { error: 'السؤال غير محدد' };

  await prisma.surveyQuestion.update({ where: { id }, data: { active } });
  refresh();
  return { success: active ? 'أُعيد السؤال إلى النموذج' : 'أُوقف السؤال — إجاباته محفوظة' };
}

export async function setQuestionRequired(id: string, required: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };
  if (!id) return { error: 'السؤال غير محدد' };

  await prisma.surveyQuestion.update({ where: { id }, data: { required } });
  refresh();
  return { success: required ? 'صار السؤال إلزامياً' : 'صار السؤال اختيارياً' };
}

/** Swap one question with its neighbour. */
export async function moveQuestion(id: string, direction: 'up' | 'down'): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  const all = await prisma.surveyQuestion.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, order: true },
  });

  const index = all.findIndex((q) => q.id === id);
  if (index === -1) return { error: 'السؤال غير موجود' };

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= all.length) return;

  // Rewritten as a dense sequence rather than swapping two numbers: rows
  // seeded or imported at some point may share an order, and swapping two
  // equal values moves nothing.
  const reordered = [...all];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  await prisma.$transaction(
    reordered.map((q, i) => prisma.surveyQuestion.update({ where: { id: q.id }, data: { order: i } })),
  );

  refresh();
}

/**
 * Delete a question and everything anybody answered to it.
 *
 * Offered because an organizer who mistyped a question the day it was written
 * should not have to live with it forever. Guarded by an explicit confirmation
 * carrying the answer count, so "remove this" cannot quietly mean "discard two
 * hundred opinions" — retiring it is the other button, and the right one
 * almost every time.
 */
export async function deleteQuestion(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  const id = String(form.get('id') || '');
  if (!id) return { error: 'السؤال غير محدد' };

  const existing = await prisma.surveyQuestion.findUnique({
    where: { id },
    select: { _count: { select: { answers: true } } },
  });
  if (!existing) return { error: 'السؤال غير موجود — ربما حُذف' };

  if (existing._count.answers > 0 && form.get('confirm') !== 'on') {
    return { error: `هذا السؤال عليه ${existing._count.answers} إجابة ستُحذف معه. أكّد الحذف، أو أوقف السؤال بدل حذفه.` };
  }

  await prisma.surveyQuestion.delete({ where: { id } });
  refresh();
  return { success: 'حُذف السؤال' };
}

/** Open the survey to answers, or close it. */
export async function setSurveyOpen(open: boolean, note: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  if (open) {
    const active = await prisma.surveyQuestion.count({ where: { active: true } });
    if (active === 0) return { error: 'لا توجد أسئلة مفعّلة — أضف سؤالاً قبل فتح الاستبيان' };
  }

  const data = { surveyOpen: open, surveyClosedNote: note.trim() || null };
  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  refresh();
  return { success: open ? 'فُتح الاستبيان' : 'أُغلق الاستبيان' };
}

/**
 * Put the shipped question set back.
 *
 * For the empty survey only. Restoring over an existing set would either
 * duplicate every question or delete answers, and neither is what anybody
 * means by "restore the defaults".
 */
export async function restoreDefaultQuestions(): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بتعديل الاستبيان' };

  const existing = await prisma.surveyQuestion.count();
  if (existing > 0) return { error: 'الاستبيان ليس فارغاً — احذف أسئلته أولاً إن أردت البدء من جديد' };

  await prisma.surveyQuestion.createMany({
    data: SEED_QUESTIONS.map((q, i) => ({
      section: q.section,
      promptAr: q.promptAr,
      helpAr: q.helpAr ?? null,
      kind: q.kind,
      options: q.options ?? [],
      required: q.required ?? false,
      order: i,
    })),
  });

  refresh();
  return { success: `أُضيف ${SEED_QUESTIONS.length} سؤالاً` };
}

/** Remove one response and its answers — a test submission, or a duplicate. */
export async function deleteResponse(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بحذف الإجابات' };
  if (!id) return { error: 'الإجابة غير محددة' };

  await prisma.surveyResponse.delete({ where: { id } });
  refresh();
  return { success: 'حُذفت الإجابة' };
}
