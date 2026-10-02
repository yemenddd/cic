import { NextResponse } from 'next/server';
import { sendMorningReminder } from '@/lib/morning-reminder';

/**
 * The scheduler's way in.
 *
 * This route is the authorization and nothing else; lib/morning-reminder.ts is
 * the work. It is a public URL on a public domain, and what it does is mail
 * every attendee — so it opens only for a caller holding CRON_SECRET, and
 * refuses outright when no secret is configured rather than falling back to
 * letting anyone in.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on its cron invocations.
 * The same header makes it testable by hand, which is how it was checked
 * before the morning it matters.
 */

// Sending runs here, one message at a time against the provider's rate limit.
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  // Fail closed. An unset secret is a misconfiguration, not permission.
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set — refusing to run');
    return NextResponse.json({ ok: false, error: 'not-configured' }, { status: 503 });
  }

  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  // `?dry=1` resolves the audience and reports its size without sending, so
  // the whole path can be exercised on a day that is not the day.
  const dryRun = new URL(req.url).searchParams.get('dry') === '1';

  const outcome = await sendMorningReminder({ dryRun });
  console.log('[cron] morning reminder:', JSON.stringify(outcome));

  return NextResponse.json({ ok: true, ...outcome });
}
