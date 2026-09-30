import { prisma } from '@/lib/db/client';
import { CATEGORIES } from '@/lib/categories';
import { inPages } from '@/lib/export-pages';
import { siteUrl } from '@/lib/site';
import { isDeliverable, sendEmailBatch, type EmailMessage } from '@/lib/email';
import { renderHtml, renderText, type EmailContent } from '@/lib/email-template';
import { MAIL_ALL, MAIL_ONE } from './audience';

/**
 * Writing to people by mail rather than into the platform.
 *
 * Announcements reach a notification feed, which reaches whoever signs in.
 * Most of the people registered for a conference sign in once, on the day they
 * register, and never again — so a change of venue delivered as an
 * announcement is a change of venue nobody read. This sends the same kind of
 * message to the address they gave.
 *
 * Deliberately NOT in actions.ts, for the same reason as the announcement
 * sender: every export of a 'use server' module is a callable endpoint, so an
 * unguarded core living there would be a way to mail the whole conference
 * without being an admin at all. The caller in actions.ts proves that first.
 */

export interface BlastInput {
  subject: string;
  body: string;
  audience: string;
  /** Only when the audience is one person. */
  toEmail: string;
  /** Both, or neither — a button with no label is invisible, one with no link is dead. */
  buttonLabel: string;
  buttonHref: string;
}

export type BlastResult =
  | { error: string }
  | { attempted: number; delivered: number; skipped: number; failed: number };

/**
 * Attendees only, and only ones with an address worth trying.
 *
 * Organizers are excluded for the same reason announcements exclude them: a
 * message to the conference is not a message to the people writing it. The
 * `@` filter keeps out the placeholder addresses the door desk invents for a
 * walk-in who never gave one — lib/email.ts refuses to send to them anyway,
 * but counting them as recipients would overstate the reach on the button.
 */
function recipientWhere(audience: string) {
  return {
    role: 'ATTENDEE' as const,
    ...(audience === MAIL_ALL ? {} : { category: audience }),
    NOT: { email: { endsWith: '.invalid' } },
  };
}

export function validateBlast(input: BlastInput): string | null {
  if (!input.subject) return 'عنوان الرسالة مطلوب';
  if (input.subject.length > 150) return 'العنوان طويل جداً — 150 حرفاً كحد أقصى';
  if (!input.body) return 'نص الرسالة مطلوب';
  if (input.body.length > 4000) return 'النص طويل جداً — 4000 حرف كحد أقصى';

  const known =
    input.audience === MAIL_ALL ||
    input.audience === MAIL_ONE ||
    CATEGORIES.some((c) => c.id === input.audience);
  if (!known) return 'الفئة المستهدفة غير صالحة';

  if (input.audience === MAIL_ONE) {
    if (!input.toEmail) return 'اكتب البريد الذي تريد الإرسال إليه';
    if (!isDeliverable(input.toEmail)) return 'هذا البريد غير صالح للإرسال';
  }

  // A button is a pair. Half of one is a bug the recipient sees, not the
  // organizer, so it is refused here rather than quietly dropped.
  if (input.buttonLabel && !input.buttonHref) return 'الزر بلا رابط — أضف المسار أو احذف عنوان الزر';
  if (input.buttonHref && !input.buttonLabel) return 'الرابط بلا عنوان — أضف عنوان الزر أو احذف المسار';

  // Internal paths only, and the same rule the announcement composer uses. A
  // button in a message signed by the conference is the conference vouching
  // for wherever it goes; accepting arbitrary URLs would turn one careless
  // admin into a mass redirect to anywhere. `//evil.com` is a
  // protocol-relative URL, hence the second character being checked too.
  if (input.buttonHref && !/^\/[^/\\]/.test(input.buttonHref)) {
    return 'رابط الزر يجب أن يكون مساراً داخلياً يبدأ بـ / مثل /program';
  }

  return null;
}

/** "مرحباً فلان،" — the first name only, and nothing at all when there is none. */
function greeting(name: string | null): string | undefined {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? `مرحباً ${first}،` : undefined;
}

/**
 * One person's copy.
 *
 * Rendered per recipient rather than once, because the greeting is theirs. The
 * rest is the same text for everybody — which is what makes this a broadcast
 * and not a merge field engine nobody asked for.
 */
function messageFor(input: BlastInput, to: string, name: string | null): EmailMessage {
  const content: EmailContent = {
    title: input.subject,
    greeting: greeting(name),
    // A blank line is a paragraph break, which is how anybody writing in a
    // textarea already expects it to work.
    paragraphs: input.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    ...(input.buttonLabel
      ? { button: { label: input.buttonLabel, href: `${siteUrl}${input.buttonHref}` } }
      : {}),
  };

  return { to, subject: input.subject, text: renderText(content), html: renderHtml(content) };
}

/**
 * Recipients read per query.
 *
 * Smaller than the announcement sender's 20,000: that one writes rows, this
 * one holds each page in memory only long enough to hand it to the provider in
 * slices of a hundred, and a page much larger than a few provider batches buys
 * nothing but a longer wait before the first message goes out.
 */
const MAIL_PAGE = 500;

export async function deliverBlast(adminId: string, input: BlastInput): Promise<BlastResult> {
  const invalid = validateBlast(input);
  if (invalid) return { error: invalid };

  const one = input.audience === MAIL_ONE;

  if (!one) {
    const total = await prisma.user.count({ where: recipientWhere(input.audience) });
    if (total === 0) return { error: 'لا يوجد أحد في هذه الفئة له بريد — لم يُرسل شيء' };
  }

  // The record is written first and its counters corrected at the end, so a
  // send that is cut off half way still leaves a row saying what happened
  // rather than vanishing and leaving the delivered mail unexplained.
  const blast = await prisma.emailBlast.create({
    data: {
      subject: input.subject,
      body: input.body,
      audience: input.audience,
      toEmail: one ? input.toEmail.trim().toLowerCase() : null,
      buttonLabel: input.buttonLabel || null,
      buttonHref: input.buttonHref || null,
      sentById: adminId,
    },
  });

  let attempted = 0;
  let delivered = 0;
  let skipped = 0;
  let failed = 0;

  const account = async (messages: EmailMessage[]) => {
    attempted += messages.length;
    for (const outcome of await sendEmailBatch(messages)) {
      if (outcome.ok) delivered += 1;
      // An address the platform invented, or one the provider was never asked
      // about, is not a failure anybody can act on — it is counted apart so a
      // send that reached everybody reachable does not read as broken.
      else if (outcome.reason === 'undeliverable' || outcome.reason === 'not-configured') skipped += 1;
      else failed += 1;
    }
  };

  try {
    if (one) {
      const to = input.toEmail.trim().toLowerCase();
      // Greeted by name when the address belongs to somebody registered, and
      // plainly when it does not — an organizer writing to a speaker who has
      // no account should still be able to.
      const known = await prisma.user.findUnique({ where: { email: to }, select: { name: true } });
      await account([messageFor(input, to, known?.name ?? null)]);
    } else {
      const pages = inPages(
        (after, take) =>
          prisma.user.findMany({
            where: recipientWhere(input.audience),
            orderBy: { id: 'asc' },
            ...(after ? { cursor: { id: after }, skip: 1 } : {}),
            take,
            select: { id: true, email: true, name: true },
          }),
        MAIL_PAGE,
      );

      for await (const page of pages) {
        await account(page.map((u) => messageFor(input, u.email, u.name)));
      }
    }
  } catch (err) {
    console.error('[email-blast] send failed part way:', err);
    await prisma.emailBlast.update({
      where: { id: blast.id },
      data: { attempted, delivered, skipped, failed },
    });
    return {
      error:
        `تعذّر إكمال الإرسال — وصلت الرسالة إلى ${delivered.toLocaleString('ar')} ` +
        'وتوقّف الإرسال. الرسالة محفوظة في السجل أدناه.',
    };
  }

  await prisma.emailBlast.update({
    where: { id: blast.id },
    data: { attempted, delivered, skipped, failed },
  });

  return { attempted, delivered, skipped, failed };
}
