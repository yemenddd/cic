import { prisma } from '@/lib/db/client';
import { CATEGORIES } from '@/lib/categories';
import { inPages } from '@/lib/export-pages';
import { AUDIENCE_ALL } from './audience';

/**
 * What sending an announcement actually does, with no notion of who is asking.
 *
 * Deliberately NOT in actions.ts: every export of a 'use server' module is a
 * callable endpoint, so an unguarded core living there would be a way to
 * broadcast to the whole conference without being an admin at all. The caller
 * in actions.ts proves the caller is an admin and then calls this.
 *
 * Keeping the two apart also makes this half testable on its own — it is a
 * plain function over a database, not a request.
 */

export interface AnnouncementInput {
  title: string;
  body: string;
  link: string;
  audience: string;
}

export type SendResult = { error: string } | { sent: number };

/**
 * Announcements land in attendees' notification feeds, never in admins' own —
 * an organizer writing to the conference is not writing to themselves.
 */
function audienceFilter(audience: string) {
  return audience === AUDIENCE_ALL
    ? { role: 'ATTENDEE' as const }
    : { role: 'ATTENDEE' as const, category: audience };
}

export function validateAnnouncement(input: AnnouncementInput): string | null {
  if (!input.title) return 'عنوان الإعلان مطلوب';
  if (input.title.length > 120) return 'العنوان طويل جداً — 120 حرفاً كحد أقصى';
  if (!input.body) return 'نص الإعلان مطلوب';
  if (input.body.length > 2000) return 'النص طويل جداً — 2000 حرف كحد أقصى';

  // Validated against the same list the form was built from, so a posted
  // value that is neither "all" nor a real category can't quietly reach zero
  // people while looking like it was sent.
  const known = input.audience === AUDIENCE_ALL || CATEGORIES.some((c) => c.id === input.audience);
  if (!known) return 'الفئة المستهدفة غير صالحة';

  // Internal paths only. The feed renders this as a link for every recipient,
  // so accepting arbitrary URLs would turn one careless admin into a mass
  // redirect to anywhere. `//evil.com` is a protocol-relative URL, hence the
  // second character being checked too.
  if (input.link && !/^\/[^/\\]/.test(input.link)) {
    return 'الرابط يجب أن يكون مساراً داخلياً يبدأ بـ / مثل /program';
  }

  return null;
}

/**
 * Notifications per insert.
 *
 * This used to be every recipient in one transaction, which is fine for a
 * hundred people: 27.5s for 167,000, with every id held in memory, and — worse
 * than the slowness — an all-or-nothing failure. A broadcast that ran out of
 * time delivered nothing, and the organiser saw an error with no way to tell
 * whether it had sent.
 *
 * Batching costs a little time, so the batch was sized by measuring it.
 * Writing 100,000 notifications:
 *
 *     1,000 per insert    49.9s
 *     5,000 per insert    17.9s
 *    20,000 per insert    11.6s
 *    all in one           10.1s   (what it used to do)
 *
 * At 20,000 the batching costs 15% over a single insert, and buys a broadcast
 * that can be interrupted without losing what it already delivered.
 */
const DELIVERY_BATCH = 20_000;

export async function deliverAnnouncement(
  adminId: string,
  input: AnnouncementInput,
): Promise<SendResult> {
  const invalid = validateAnnouncement(input);
  if (invalid) return { error: invalid };

  const where = audienceFilter(input.audience);
  const total = await prisma.user.count({ where });
  if (total === 0) return { error: 'لا يوجد أحد في هذه الفئة — لم يُرسل شيء' };

  const link = input.link || null;

  // The record is written first, and its count corrected at the end. An
  // announcement that stops halfway now leaves a row saying so, rather than
  // vanishing and leaving the delivered notifications unexplained.
  const announcement = await prisma.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      link,
      audience: input.audience,
      recipients: 0,
      sentById: adminId,
    },
  });

  let delivered = 0;

  try {
    // The recipients are paged too, not just the inserts: holding 167,000 ids
    // in memory was the other half of the cost.
    const pages = inPages(
      (after, take) =>
        prisma.user.findMany({
          where,
          orderBy: { id: 'asc' },
          ...(after ? { cursor: { id: after }, skip: 1 } : {}),
          take,
          select: { id: true },
        }),
      DELIVERY_BATCH,
    );

    for await (const page of pages) {
      await prisma.notification.createMany({
        data: page.map((r) => ({
          userId: r.id,
          title: input.title,
          body: input.body,
          link,
          kind: 'ANNOUNCEMENT' as const,
        })),
      });
      delivered += page.length;
    }
  } catch {
    await prisma.announcement.update({
      where: { id: announcement.id },
      data: { recipients: delivered },
    });
    return {
      error:
        `تعذّر إكمال الإرسال — وصل الإعلان إلى ${delivered.toLocaleString('ar')} من ` +
        `${total.toLocaleString('ar')}. الإعلان محفوظ، ويمكن إعادة الإرسال للبقية.`,
    };
  }

  await prisma.announcement.update({
    where: { id: announcement.id },
    data: { recipients: delivered },
  });

  return { sent: delivered };
}
