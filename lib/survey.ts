import type { SurveyQuestionKind } from '@prisma/client';

/**
 * The survey as it is first written, and the rules that outlive any one
 * question.
 *
 * The questions live in the database so an organizer can change them between
 * editions, which means the platform needs an opinion about what a reasonable
 * first set looks like — otherwise the feature ships as an empty form and the
 * first thing anybody does with it is invent fifteen questions at midnight.
 */

export const SURVEY_SECTIONS = [
  'المؤتمر ككل',
  'الجلسات',
  'الحفلان',
  'التنظيم والاستقبال',
  'المكان والضيافة',
  'الدورة القادمة',
] as const;

export interface SeedQuestion {
  section: string;
  promptAr: string;
  helpAr?: string;
  kind: SurveyQuestionKind;
  options?: string[];
  required?: boolean;
}

/**
 * Deliberately short, and deliberately mostly optional.
 *
 * Every extra question costs responses — the drop-off is steepest past the
 * first screen — so the ones that must be answered are the two the organizers
 * will actually plan from, and the rest are offered. The free-text questions
 * are last because somebody who abandons the form there has already given the
 * ratings.
 */
export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    section: 'المؤتمر ككل',
    promptAr: 'ما تقييمك العام للمؤتمر؟',
    kind: 'RATING',
    required: true,
  },
  {
    section: 'المؤتمر ككل',
    promptAr: 'ما مدى احتمال أن توصي صديقاً بحضور الدورة القادمة؟',
    helpAr: 'من 0 (لن أوصي إطلاقاً) إلى 10 (سأوصي بالتأكيد)',
    kind: 'SCALE_10',
    required: true,
  },
  {
    section: 'المؤتمر ككل',
    promptAr: 'كيف علمت بالمؤتمر؟',
    kind: 'CHOICE',
    options: ['صديق أو زميل', 'وسائل التواصل', 'الجامعة أو جهة العمل', 'جمعية أو منظمة', 'موقع المؤتمر', 'أخرى'],
  },
  {
    section: 'الجلسات',
    promptAr: 'ما تقييمك لمحتوى الجلسات العلمية؟',
    kind: 'RATING',
  },
  {
    section: 'الجلسات',
    promptAr: 'ما تقييمك لعروض الابتكارات والمشاريع؟',
    kind: 'RATING',
  },
  {
    section: 'الجلسات',
    promptAr: 'ما تقييمك للمتحدثين ومستوى تقديمهم؟',
    kind: 'RATING',
  },
  {
    section: 'الجلسات',
    promptAr: 'أي جلسة كانت الأفضل بالنسبة لك؟ ولماذا؟',
    kind: 'TEXT',
  },
  {
    section: 'الحفلان',
    promptAr: 'ما تقييمك لحفل الافتتاح؟',
    kind: 'RATING',
  },
  {
    section: 'الحفلان',
    promptAr: 'ما تقييمك للحفل الختامي؟',
    kind: 'RATING',
  },
  {
    section: 'التنظيم والاستقبال',
    promptAr: 'ما تقييمك للاستقبال والتسجيل عند الباب؟',
    kind: 'RATING',
  },
  {
    section: 'التنظيم والاستقبال',
    promptAr: 'ما تقييمك لعمل اللجان المنظِّمة وتعاونها معك؟',
    kind: 'RATING',
  },
  {
    section: 'التنظيم والاستقبال',
    promptAr: 'ما تقييمك للالتزام بالمواعيد وسير البرنامج؟',
    kind: 'RATING',
  },
  {
    section: 'المكان والضيافة',
    promptAr: 'ما تقييمك للقاعات والمكان؟',
    kind: 'RATING',
  },
  {
    section: 'المكان والضيافة',
    promptAr: 'ما تقييمك للضيافة والاستراحات؟',
    kind: 'RATING',
  },
  {
    section: 'الدورة القادمة',
    promptAr: 'ما الذي أعجبك أكثر في المؤتمر؟',
    kind: 'TEXT',
  },
  {
    section: 'الدورة القادمة',
    promptAr: 'ما الذي تقترح تحسينه في الدورة القادمة؟',
    kind: 'TEXT',
  },
  {
    section: 'الدورة القادمة',
    promptAr: 'ما الموضوعات التي تودّ أن يتناولها المؤتمر القادم؟',
    kind: 'TEXT',
  },
];

/** The length of the scale a kind is answered on, or null if it has none. */
export function scaleOf(kind: SurveyQuestionKind): { min: number; max: number } | null {
  if (kind === 'RATING') return { min: 1, max: 5 };
  if (kind === 'SCALE_10') return { min: 0, max: 10 };
  return null;
}

export const KIND_LABELS: Record<SurveyQuestionKind, string> = {
  RATING: 'تقييم من 1 إلى 5',
  SCALE_10: 'مقياس من 0 إلى 10',
  CHOICE: 'اختيار واحد',
  MULTI: 'اختيار متعدد',
  TEXT: 'نص حر',
};

/** Free text is capped so one paste cannot fill a column. */
export const MAX_TEXT_ANSWER = 2000;

/**
 * Net Promoter Score from the 0–10 answers.
 *
 * Reported because it is the one number from a survey like this that means the
 * same thing to everybody who reads it, and because an average of 0–10 answers
 * — the obvious alternative — hides exactly the thing it measures: a room
 * split between enthusiasts and the disappointed averages to the same place as
 * a room of shrugs.
 */
export function nps(scores: number[]): { score: number; promoters: number; passives: number; detractors: number } | null {
  if (scores.length === 0) return null;

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const s of scores) {
    if (s >= 9) promoters++;
    else if (s >= 7) passives++;
    else detractors++;
  }

  return {
    score: Math.round(((promoters - detractors) / scores.length) * 100),
    promoters,
    passives,
    detractors,
  };
}

/** The mean of a set of ratings, to one decimal, or null when nobody answered. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/**
 * How many answers fell on each point of a scale.
 *
 * Returned for every point, including the ones nobody chose: a bar chart with
 * a missing column reads as a narrower scale rather than as a zero.
 */
export function distribution(values: number[], min: number, max: number): { value: number; count: number }[] {
  const counts = new Map<number, number>();
  for (let v = min; v <= max; v++) counts.set(v, 0);
  for (const v of values) if (counts.has(v)) counts.set(v, counts.get(v)! + 1);
  return [...counts].map(([value, count]) => ({ value, count }));
}

/** How many times each option was chosen, in the order the question lists them. */
export function tally(options: string[], chosen: string[][]): { option: string; count: number }[] {
  const counts = new Map(options.map((o) => [o, 0]));
  for (const row of chosen) {
    for (const c of row) if (counts.has(c)) counts.set(c, counts.get(c)! + 1);
  }
  return options.map((option) => ({ option, count: counts.get(option) ?? 0 }));
}
