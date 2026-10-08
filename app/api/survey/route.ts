import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getSiteSettings } from '@/lib/site-settings-server';
import { SURVEY_BY_IP, clientIp, recordFailure, throttleState } from '@/lib/rate-limit';
import { submitSurvey } from '@/lib/survey-submit';
import { MAX_TEXT_ANSWER } from '@/lib/survey';

/**
 * Where the survey is answered.
 *
 * Open to people without an account on purpose: the door registered 136 of the
 * attendees and their accounts have no usable password, so a survey behind a
 * login would be a survey of the minority who signed up online. A session is
 * read when there is one — it is what lets the results be split by tier, and
 * what stops one account answering twice — but it is never required.
 */

const Body = z.object({
  answers: z.array(z.object({
    questionId: z.string().min(1).max(64),
    rating: z.number().int().min(0).max(10).nullish(),
    text: z.string().max(MAX_TEXT_ANSWER).nullish(),
    choices: z.array(z.string().max(300)).max(40).optional(),
  })).min(1).max(200),
});

export async function POST(req: Request) {
  // Checked here and not only on the page: a closed survey that still accepts
  // a posted body is not closed.
  const settings = await getSiteSettings();
  if (!settings.surveyOpen) {
    return NextResponse.json(
      { ok: false, error: settings.surveyClosedNote || 'الاستبيان مغلق حالياً' },
      { status: 403 },
    );
  }

  const ip = clientIp(req.headers);
  if (ip) {
    const state = await throttleState('survey:ip', ip);
    if (state.blocked) {
      return NextResponse.json(
        { ok: false, error: 'محاولات كثيرة — حاول مرة أخرى بعد قليل' },
        { status: 429, headers: { 'Retry-After': String(state.retryAfter) } },
      );
    }
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'طلب غير صالح' }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'إجابات غير صالحة' }, { status: 400 });
  }

  const session = await auth();

  const result = await submitSurvey({
    answers: parsed.data.answers.map((a) => ({
      questionId: a.questionId,
      rating: a.rating ?? null,
      text: a.text ?? null,
      choices: a.choices ?? [],
    })),
    userId: session?.user?.id ?? null,
  });

  // Counted whether it was accepted or refused. A submission is cheap but a
  // thousand of them are a fabricated result, and the ceiling is well above
  // what one person filling in one form will ever reach.
  if (ip) await recordFailure('survey:ip', ip, SURVEY_BY_IP);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, field: result.field }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
