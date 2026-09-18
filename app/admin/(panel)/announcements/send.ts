import { prisma } from '@/lib/db/client';
import { CATEGORIES } from '@/lib/categories';
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

export async function deliverAnnouncement(
  adminId: string,
  input: AnnouncementInput,
): Promise<SendResult> {
  const invalid = validateAnnouncement(input);
  if (invalid) return { error: invalid };

  const recipients = await prisma.user.findMany({
    where: audienceFilter(input.audience),
    select: { id: true },
  });

  if (recipients.length === 0) return { error: 'لا يوجد أحد في هذه الفئة — لم يُرسل شيء' };

  const link = input.link || null;

  // One transaction: an announcement recorded without its notifications would
  // claim to have reached people it never reached, and notifications without
  // the record would have no audit trail at all.
  await prisma.$transaction([
    prisma.notification.createMany({
      data: recipients.map((r) => ({ userId: r.id, title: input.title, body: input.body, link })),
    }),
    prisma.announcement.create({
      data: {
        title: input.title,
        body: input.body,
        link,
        audience: input.audience,
        recipients: recipients.length,
        sentById: adminId,
      },
    }),
  ]);

  return { sent: recipients.length };
}
