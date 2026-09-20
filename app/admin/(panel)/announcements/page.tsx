import { Megaphone } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import { audienceLabel } from './audience';
import { audienceSizes, sendAnnouncement } from './actions';
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
      include: { sentBy: { select: { name: true, email: true } } },
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
            <div
              key={a.id}
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
                  {a.title}
                </h3>
                <span
                  className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold shrink-0"
                  style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
                >
                  {a.recipients} مستلم
                </span>
              </div>

              <p
                className="mt-2 text-[13px] leading-relaxed whitespace-pre-line"
                style={{ color: 'var(--text-secondary)' }}
              >
                {a.body}
              </p>

              <p className="mt-3 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                {audienceLabel(a.audience)} · {a.createdAt.toLocaleDateString('ar')}
                {/* The sender is null only if that admin account was deleted
                    later — the record of the send survives them. */}
                {a.sentBy && ` · ${a.sentBy.name || a.sentBy.email}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
