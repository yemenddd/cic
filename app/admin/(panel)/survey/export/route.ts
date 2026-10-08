import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { categoryLabel } from '@/lib/categories';
import { toCsv } from '@/lib/csv';

/**
 * The survey as a spreadsheet — one row per response, one column per question.
 *
 * Wide rather than long on purpose: an organizer opens this to cross-tabulate
 * ("what did the volunteers think of the reception"), and that is one filter
 * in a spreadsheet when each respondent is a row, and a pivot table when each
 * answer is.
 *
 * Every question is a column, retired ones included, so a file exported in
 * March still lines up with one exported in January.
 *
 * Guarded here in its own right: a route handler does not sit under the panel
 * layout, so nothing above it has checked who is asking — and this file
 * carries everything anybody wrote in a free-text box.
 */
export const maxDuration = 60;

export async function GET() {
  if (!(await requireAdmin())) return new Response('Forbidden', { status: 403 });

  const questions = await prisma.surveyQuestion.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, promptAr: true, active: true },
  });

  const responses = await prisma.surveyResponse.findMany({
    orderBy: { submittedAt: 'asc' },
    select: {
      id: true, category: true, attended: true, submittedAt: true,
      user: { select: { name: true } },
      answers: { select: { questionId: true, rating: true, text: true, choices: true } },
    },
  });

  const header = [
    'وقت الإرسال',
    'الفئة',
    'حضر المؤتمر',
    'مُسجَّل الدخول',
    ...questions.map((q) => (q.active ? q.promptAr : `${q.promptAr} (موقوف)`)),
  ];

  const rows = responses.map((r) => {
    const byQuestion = new Map(r.answers.map((a) => [a.questionId, a]));
    return [
      r.submittedAt.toISOString(),
      categoryLabel(r.category, 'ar') || r.category || '',
      r.attended ? 'نعم' : 'لا',
      r.user ? 'نعم' : 'لا',
      ...questions.map((q) => {
        const a = byQuestion.get(q.id);
        if (!a) return '';
        if (typeof a.rating === 'number') return a.rating;
        if (a.choices.length) return a.choices.join(' | ');
        return a.text ?? '';
      }),
    ];
  });

  const body = toCsv(header, rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cic-survey-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
