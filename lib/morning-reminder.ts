import { prisma } from '@/lib/db/client';
import { isDeliverable, sendEmail } from '@/lib/email';
import { renderHtml, renderText, type EmailContent } from '@/lib/email-template';
import { siteUrl } from '@/lib/site';

/**
 * The reminder that goes out on the morning of the day itself.
 *
 * Sent by a scheduler rather than by a person, because the person it would
 * otherwise depend on is running a conference that morning. Everything here is
 * therefore written to survive being run unattended: it refuses to send on any
 * day but the one it is for, it refuses to send twice, and it reports what it
 * did rather than throwing.
 *
 * Deliberately not a 'use server' module and not a route: the route is the
 * authorization, this is the work, and keeping them apart is what lets the
 * whole thing be exercised without a scheduler.
 */

/** The conference timezone. Everything the attendees read is in local time. */
const ZONE = 'Europe/Istanbul';

/**
 * The one morning this is for.
 *
 * A date rather than "every day until the conference": a daily job that mails
 * the whole attendee list is one configuration mistake away from mailing them
 * every day, and the blast log is not something an apology can be unsent from.
 */
const SEND_ON = '2026-10-03';

/** Today where the conference is, as YYYY-MM-DD. */
export function conferenceToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(now);
}

/**
 * The key that makes a second run do nothing.
 *
 * The scheduler may retry, a deploy may overlap one, and a person may call the
 * route by hand to check it. Each of those is fine; each of them sending the
 * mail again is not. The audience column carries the date, so "has this
 * already gone out today" is one indexed lookup rather than a guess about
 * timestamps.
 */
const keyFor = (day: string) => `morning-reminder:${day}`;

const SUBJECT = 'اليوم: الحفل الختامي لمؤتمر الإبداع والابتكار';

const BODY = [
  'صباح الخير — اليوم ختام مؤتمر الإبداع والابتكار، ويسعدنا أن نراك فيه.',
  'الحفل الختامي من الساعة 2:00 حتى 4:00 عصراً.',
  'احضر ببطاقتك: تجدها في رسالة تسجيلك، أو في حسابك على المنصة. '
    + 'يُمسح رمزها عند الباب، ولا حاجة لشيء غيرها.',
];

const BUTTON = { label: 'الدخول إلى حسابي', href: `${siteUrl}/login` } as const;

export type ReminderOutcome =
  | { status: 'not-today'; today: string; sendOn: string }
  | { status: 'already-sent'; day: string; delivered: number }
  | { status: 'dry-run'; day: string; recipients: number }
  | { status: 'sent'; day: string; attempted: number; delivered: number; failed: number };

/**
 * Everybody who may come in and can be reached.
 *
 * Admitted only: telling somebody whose application is still undecided that we
 * will see them today is telling them they were accepted. And the addresses
 * the door invents for a walk-in are refused by isDeliverable, so nothing is
 * ever sent to one.
 */
async function recipients() {
  const rows = await prisma.user.findMany({
    where: { role: 'ATTENDEE', status: 'APPROVED' },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.filter((u) => isDeliverable(u.email));
}

function messageFor(name: string | null): EmailContent {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return {
    title: 'اليوم ختام المؤتمر',
    ...(first ? { greeting: `مرحباً ${first}،` } : {}),
    paragraphs: BODY,
    button: { ...BUTTON },
  };
}

export async function sendMorningReminder(
  opts: { dryRun?: boolean; now?: Date } = {},
): Promise<ReminderOutcome> {
  const day = conferenceToday(opts.now);
  if (day !== SEND_ON) return { status: 'not-today', today: day, sendOn: SEND_ON };

  const key = keyFor(day);

  const already = await prisma.emailBlast.findFirst({
    where: { audience: key },
    select: { delivered: true },
  });
  if (already) return { status: 'already-sent', day, delivered: already.delivered };

  const people = await recipients();
  if (opts.dryRun) return { status: 'dry-run', day, recipients: people.length };

  // Written before the first message goes out, so a run that is cut off half
  // way still blocks a second one — and still says how far it got.
  const blast = await prisma.emailBlast.create({
    data: {
      subject: SUBJECT,
      body: BODY.join('\n\n'),
      audience: key,
      buttonLabel: BUTTON.label,
      buttonHref: '/login',
      attempted: people.length,
    },
  });

  let delivered = 0;
  let failed = 0;

  for (const u of people) {
    const content = messageFor(u.name);
    const r = await sendEmail({
      to: u.email,
      subject: SUBJECT,
      text: renderText(content),
      html: renderHtml(content),
    });
    if (r.ok) delivered++;
    else failed++;

    // The provider rate-limits single sends; this stays well under it.
    await new Promise((res) => setTimeout(res, 650));
  }

  await prisma.emailBlast.update({ where: { id: blast.id }, data: { delivered, failed } });

  return { status: 'sent', day, attempted: people.length, delivered, failed };
}
