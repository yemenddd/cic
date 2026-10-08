import { prisma } from '@/lib/db/client';
import { MAX_TEXT_ANSWER, scaleOf } from '@/lib/survey';

/**
 * Taking one person's answers.
 *
 * Separate from the route for the usual reason: the route is the public
 * surface and the throttle, this is the rule about what a valid answer is, and
 * only the second half is worth checking on its own.
 *
 * Every answer is validated against the question it claims to answer, read
 * from the database at the moment of submission. The form is not trusted to
 * say what kind a question is, what its options are, or whether it is still
 * being asked — all three are things a posted body can lie about, and a
 * retired question accepting answers is how results drift from the form.
 */

export interface SubmittedAnswer {
  questionId: string;
  rating?: number | null;
  text?: string | null;
  choices?: string[];
}

export type SubmitResult =
  | { ok: true; responseId: string }
  | { ok: false; error: string; field?: string };

export async function submitSurvey(params: {
  answers: SubmittedAnswer[];
  userId?: string | null;
}): Promise<SubmitResult> {
  const questions = await prisma.surveyQuestion.findMany({
    where: { active: true },
    select: { id: true, kind: true, options: true, required: true, promptAr: true },
  });

  if (questions.length === 0) return { ok: false, error: 'لا توجد أسئلة في الاستبيان حالياً' };

  const given = new Map(params.answers.map((a) => [a.questionId, a]));

  const rows: Array<{ questionId: string; rating: number | null; text: string | null; choices: string[] }> = [];

  for (const q of questions) {
    const a = given.get(q.id);
    const scale = scaleOf(q.kind);

    // What counts as "answered" differs by kind, and an empty string is not an
    // answer however the form chose to send it.
    let rating: number | null = null;
    let text: string | null = null;
    let choices: string[] = [];

    if (scale) {
      const n = a?.rating;
      if (typeof n === 'number' && Number.isInteger(n) && n >= scale.min && n <= scale.max) rating = n;
    } else if (q.kind === 'TEXT') {
      const t = (a?.text ?? '').trim();
      if (t) text = t.slice(0, MAX_TEXT_ANSWER);
    } else {
      // Only options this question actually offers. Anything else is a posted
      // value that was never on screen.
      const wanted = (a?.choices ?? []).filter((c) => q.options.includes(c));
      choices = q.kind === 'CHOICE' ? wanted.slice(0, 1) : [...new Set(wanted)];
    }

    const answered = rating !== null || text !== null || choices.length > 0;

    if (!answered) {
      if (q.required) return { ok: false, error: `سؤال مطلوب بلا إجابة: ${q.promptAr}`, field: q.id };
      // Unanswered optional questions are not stored. A row of nulls would be
      // indistinguishable from an answer in every count that follows.
      continue;
    }

    rows.push({ questionId: q.id, rating, text, choices });
  }

  if (rows.length === 0) return { ok: false, error: 'لم تُجب على أي سؤال' };

  // What the answers are worth reading against. Taken once, here, rather than
  // joined later: a tier can change and an account can be deleted, and the
  // reading of the survey should not change with them.
  let category: string | null = null;
  let attended = false;

  if (params.userId) {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { category: true, _count: { select: { attendance: true } } },
    });
    if (user) {
      category = user.category;
      attended = user._count.attendance > 0;
    }
  }

  try {
    const response = await prisma.surveyResponse.create({
      data: {
        userId: params.userId ?? null,
        category,
        attended,
        answers: { create: rows },
      },
      select: { id: true },
    });
    return { ok: true, responseId: response.id };
  } catch (err) {
    // P2002 on userId: this account has already answered. Not an error worth
    // a stack trace — it is the unique index doing its job.
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'لقد أجبت على الاستبيان من قبل — شكراً لك' };
    }
    console.error('[survey] failed to store a response:', err);
    return { ok: false, error: 'تعذّر حفظ إجابتك، حاول مرة أخرى' };
  }
}
