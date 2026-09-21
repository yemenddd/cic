import { Megaphone } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import { audienceLabel } from './audience';
import {
  audienceSizes, sendAnnouncement, updateAnnouncement, removeAnnouncement, sendToNewRecipients,
} from './actions';
import SentAnnouncementCard from './SentAnnouncement';
import Composer from './Composer';

/**
 * Sending runs as a server action on this segment, so this is what bounds it.
 * A broadcast writes one notification per attendee — measured at 15.6s for
 * 83,000 recipients — which is comfortably past the default.
 */
export const maxDuration = 60;

export default async function AdminAnnouncementsPage() {
  const [sizes, sent] = await Promise.all([
    audienceSizes(),
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        sentBy: { select: { name: true, email: true } },
        // How many of the delivered copies have been opened. The recipient
        // count says how many were written to, which on its own says nothing
        // about whether the notice was seen.
        _count: { select: { notifications: { where: { read: true } } } },
      },
    }),
  ]);

  return (
    <div>
      <ListPageHeader title="الإعلانات" />

      <p className="text-[13px] leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        يصل الإعلان إلى صفحة الإشعارات لدى كل مستلم داخل المنصة — مناسب لتغيير في الجدول،
        أو تفاصيل المكان، أو تذكير قبل انطلاق المؤتمر.
      </p>

      <Composer action={sendAnnouncement} sizes={sizes} />

      <h2 className="font-outfit font-bold text-[15px] mt-10 mb-4" style={{ color: 'var(--text-primary)' }}>
        ما تم إرساله
      </h2>

      {sent.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--mat-liquid-bg)' }}
          >
            <Megaphone className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            لم تُرسل أي إعلانات بعد
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sent.map((a) => (
            <SentAnnouncementCard
              key={a.id}
              announcement={{
                id: a.id,
                title: a.title,
                body: a.body,
                link: a.link,
                audience: a.audience,
                audienceLabel: audienceLabel(a.audience),
                recipients: a.recipients,
                readCount: a._count.notifications,
                sentAt: a.createdAt.toLocaleDateString('ar'),
                // The sender is null only if that admin account was deleted
                // later — the record of the send survives them.
                sentBy: a.sentBy ? a.sentBy.name || a.sentBy.email : null,
              }}
              updateAction={updateAnnouncement}
              removeAction={removeAnnouncement}
              resendAction={sendToNewRecipients}
            />
          ))}
        </div>
      )}
    </div>
  );
}
