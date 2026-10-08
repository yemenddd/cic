import { prisma } from '@/lib/db/client';
import { average, distribution, nps, scaleOf, tally } from '@/lib/survey';
import type { SurveyQuestionKind } from '@prisma/client';

/**
 * Reading the survey.
 *
 * A plain module, not a server action: this is arithmetic over rows, the
 * guard belongs to the caller, and keeping them apart is what lets the
 * aggregation be checked without a request.
 *
 * Everything is computed from the answers that exist. A question nobody
 * answered reports zero rather than being dropped — "nobody answered this" is
 * itself a finding, and a results page that silently omits a question is one
 * an organizer cannot tell from a question that was never asked.
 */

export interface ScaleResult {
  kind: 'scale';
  answered: number;
  average: number | null;
  distribution: { value: number; count: number }[];
  /** Only for the 0–10 question. */
  nps: ReturnType<typeof nps>;
}

export interface ChoiceResult {
  kind: 'choice';
  answered: number;
  tally: { option: string; count: number }[];
}

export interface TextResult {
  kind: 'text';
  answered: number;
  /** Newest first, capped — the page shows a window and the CSV has them all. */
  samples: { text: string; at: Date }[];
}

export type QuestionResult = ScaleResult | ChoiceResult | TextResult;

export interface QuestionWithResult {
  id: string;
  section: string;
  promptAr: string;
  helpAr: string | null;
  kind: SurveyQuestionKind;
  options: string[];
  required: boolean;
  active: boolean;
  order: number;
  /** How many answers exist — what makes deleting it destructive. */
  answerCount: number;
  result: QuestionResult;
}

export interface SurveyOverview {
  responses: number;
  signedIn: number;
  anonymous: number;
  attended: number;
  byCategory: { category: string; count: number }[];
  first: Date | null;
  last: Date | null;
}

const TEXT_SAMPLE_LIMIT = 200;

export async function surveyOverview(): Promise<SurveyOverview> {
  const rows = await prisma.surveyResponse.findMany({
    select: { userId: true, category: true, attended: true, submittedAt: true },
    orderBy: { submittedAt: 'asc' },
  });

  const byCategory = new Map<string, number>();
  for (const r of rows) {
    const key = r.category ?? '—';
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }

  return {
    responses: rows.length,
    signedIn: rows.filter((r) => r.userId).length,
    anonymous: rows.filter((r) => !r.userId).length,
    attended: rows.filter((r) => r.attended).length,
    byCategory: [...byCategory].map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    first: rows[0]?.submittedAt ?? null,
    last: rows[rows.length - 1]?.submittedAt ?? null,
  };
}

/**
 * Every question with what has been answered to it.
 *
 * Retired questions are included: their answers are still results, and an
 * organizer who turned a question off in week two still has to be able to read
 * what week one said.
 */
export async function questionResults(): Promise<QuestionWithResult[]> {
  const questions = await prisma.surveyQuestion.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  const answers = await prisma.surveyAnswer.findMany({
    select: {
      questionId: true, rating: true, text: true, choices: true,
      response: { select: { submittedAt: true } },
    },
    orderBy: { response: { submittedAt: 'desc' } },
  });

  const byQuestion = new Map<string, typeof answers>();
  for (const a of answers) {
    const list = byQuestion.get(a.questionId);
    if (list) list.push(a);
    else byQuestion.set(a.questionId, [a]);
  }

  return questions.map((q) => {
    const mine = byQuestion.get(q.id) ?? [];
    const scale = scaleOf(q.kind);

    let result: QuestionResult;

    if (scale) {
      const values = mine.map((a) => a.rating).filter((v): v is number => typeof v === 'number');
      result = {
        kind: 'scale',
        answered: values.length,
        average: average(values),
        distribution: distribution(values, scale.min, scale.max),
        nps: q.kind === 'SCALE_10' ? nps(values) : null,
      };
    } else if (q.kind === 'TEXT') {
      const texts = mine
        .filter((a) => a.text && a.text.trim())
        .map((a) => ({ text: a.text!.trim(), at: a.response.submittedAt }));
      result = { kind: 'text', answered: texts.length, samples: texts.slice(0, TEXT_SAMPLE_LIMIT) };
    } else {
      const chosen = mine.map((a) => a.choices).filter((c) => c.length > 0);
      result = { kind: 'choice', answered: chosen.length, tally: tally(q.options, chosen) };
    }

    return {
      id: q.id,
      section: q.section,
      promptAr: q.promptAr,
      helpAr: q.helpAr,
      kind: q.kind,
      options: q.options,
      required: q.required,
      active: q.active,
      order: q.order,
      answerCount: mine.length,
      result,
    };
  });
}

/**
 * Answers per day, with the silent days kept.
 *
 * Every date between the first answer and the last, including the ones nobody
 * answered on: a chart that skips a quiet day draws a steady trickle where
 * there was a gap, which is the opposite of what happened.
 */
export function dailyCounts(
  dates: Date[],
): { day: string; label: string; count: number }[] {
  if (dates.length === 0) return [];

  const key = (d: Date) => d.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(key(d), (counts.get(key(d)) ?? 0) + 1);

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const first = new Date(key(sorted[0]));
  const last = new Date(key(sorted[sorted.length - 1]));

  const out: { day: string; label: string; count: number }[] = [];
  // Capped: a survey left open for a year is not a chart, and the organizers
  // read the last month of it.
  for (let d = new Date(first); d <= last && out.length < 92; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = key(d);
    out.push({ day: k, label: k.slice(8), count: counts.get(k) ?? 0 });
  }
  return out;
}

/**
 * The average of one question, split by who answered it.
 *
 * The cross-tab an organizer asks for out loud — "what did the volunteers
 * think of the reception" — and the one thing a single average can never say.
 */
export async function averagesByCategory(
  questionId: string,
): Promise<{ category: string; average: number | null; answered: number }[]> {
  const rows = await prisma.surveyAnswer.findMany({
    where: { questionId, rating: { not: null } },
    select: { rating: true, response: { select: { category: true } } },
  });

  const byCategory = new Map<string, number[]>();
  for (const r of rows) {
    const key = r.response.category ?? '—';
    const list = byCategory.get(key);
    if (list) list.push(r.rating!);
    else byCategory.set(key, [r.rating!]);
  }

  return [...byCategory]
    .map(([category, values]) => ({ category, average: average(values), answered: values.length }))
    .sort((a, b) => b.answered - a.answered);
}

/** Every date an answer arrived on, for the daily chart. */
export async function responseDates(): Promise<Date[]> {
  const rows = await prisma.surveyResponse.findMany({ select: { submittedAt: true } });
  return rows.map((r) => r.submittedAt);
}
