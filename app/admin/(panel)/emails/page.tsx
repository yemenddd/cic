import { Mail } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import { emailConfigured } from '@/lib/email';
import { mailAudienceLabel } from './audience';
import { mailAudienceSizes, sendBlast } from './actions';
import Composer from './Composer';

/**
 * Sending runs as a server action on this segment, so this is what bounds it.
 * The provider takes a hundred messages per request, so a conference-sized
 * list is a handful of round trips rather than one per person — but it is
 * still the network, and the default would cut a large send in half.
 */
export const maxDuration = 60;

export default async function AdminEmailsPage() {
  const [sizes, sent] = await Promise.all([
    mailAudienceSizes(),
    prisma.emailBlast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { sentBy: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div>
      <ListPageHeader title="البريد" />

      <p className="text-[13px] leading-relaxed mb-5 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
        رسالة تصل إلى بريد المسجَّلين مباشرة — لا إلى إشعارات المنصة. استخدمها لما يجب أن يصل
        فعلاً: تغيير في الموعد أو المكان، تعليمات الدخول، أو تذكير قبل انطلاق المؤتمر.
      </p>

      {/* Said before the form, not after a send that went nowhere. */}
      {!emailConfigured() && (
        <div
          className="rounded-2xl px-5 py-4 mb-5 text-[13px] leading-relaxed"
          style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444' }}
        >
          البريد غير مُهيّأ على الخادم — لن تصل أي رسالة حتى تُضبط إعدادات مزوّد البريد.
        </div>
      )}

      <Composer action={sendBlast} sizes={sizes} />

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
            <Mail className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            لم تُرسل أي رسالة بعد
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sent.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl px-5 py-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                  {b.subject}
                </h3>
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  {b.createdAt.toLocaleDateString('ar')}
                </span>
              </div>

              <p
                className="text-[13px] leading-relaxed mt-2 whitespace-pre-line line-clamp-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {b.body}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                <span>{b.toEmail ? <span dir="ltr">{b.toEmail}</span> : mailAudienceLabel(b.audience)}</span>
                <span>وصلت إلى {b.delivered} من {b.attempted}</span>
                {b.skipped > 0 && <span>{b.skipped} بلا بريد صالح</span>}
                {b.failed > 0 && <span style={{ color: '#ef4444' }}>{b.failed} تعذّرت</span>}
                {/* Null only if that admin account was deleted later — the
                    record of the send survives them. */}
                {b.sentBy && <span>أرسلها {b.sentBy.name || b.sentBy.email}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
