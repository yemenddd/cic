'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, CircleCheck, Download, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import QRCode from '@/components/ui/QRCode';

export interface BadgeProps {
  name:          string;
  categoryId:    string;
  categoryLabel: string;
  organization?: string;
  track:         string;
  code:          string;
  date:          string;
  location:      string;
  lang:          'ar' | 'en' | 'tr';
  onDownloadPDF: () => void;
  onCopyLink:    () => void;
  copied:        boolean;
  /** Where the secondary "back" button goes. Defaults to the public homepage. */
  backHref?: string;
  backLabel?: string;
  /** Overrides the copy button's label when it copies something other than a link. */
  copyLabel?: string;
  /**
   * The signed badge token this pass should carry as a QR code — what the
   * scanner at the door actually reads. Computed on the server (it is an HMAC)
   * and passed in, so this component stays a pure renderer.
   *
   * Omitted on the public confirmation screen, which is rendered from URL
   * parameters and has no account to sign for. That badge falls back to the
   * decorative strip below, and the attendee gets the real one from their
   * dashboard once they sign in.
   */
  qrValue?: string;
}

const CATEGORY_ACCENT: Record<string, { from: string; to: string }> = {
  visitor:     { from: '#0891b2', to: '#06b6d4' },
  participant: { from: '#7c3aed', to: '#8b5cf6' },
  volunteer:   { from: '#059669', to: '#10b981' },
};
const DEFAULT_ACCENT = { from: '#1e40af', to: '#3b82f6' };

function BarcodeSVG({ code }: { code: string }) {
  const bars = useMemo(() => {
    let h = 0;
    for (let i = 0; i < code.length; i++) h = Math.imul((h << 5) + h, 1) + code.charCodeAt(i);
    const result: number[] = [];
    for (let i = 0; i < 52; i++) {
      h = Math.imul(h ^ (h >>> 15), 0x85ebca77) >>> 0;
      result.push((h % 3) + 1);
    }
    return result;
  }, [code]);

  let x = 0;
  const rects: { x: number; w: number; tall: boolean }[] = [];
  bars.forEach((w, i) => { rects.push({ x, w, tall: i % 7 !== 0 }); x += w + 1.5; });

  return (
    <svg width="100%" height="40" viewBox={`0 0 ${x} 40`} preserveAspectRatio="none">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.tall ? 0 : 5} width={r.w} height={r.tall ? 40 : 30}
          fill="#334155" opacity={r.tall ? 0.9 : 0.45} />
      ))}
    </svg>
  );
}

export default function ConferenceBadge({
  name, categoryId, categoryLabel, organization, track,
  code, date, location, lang,
  onDownloadPDF, onCopyLink, copied,
  backHref = '/', backLabel, copyLabel, qrValue,
}: BadgeProps) {
  const isRtl = lang === 'ar';
  const accent = CATEGORY_ACCENT[categoryId] ?? DEFAULT_ACCENT;
  const dir = isRtl ? 'rtl' : 'ltr';
  // Theme tokens rather than a useTheme() read: these colours were resolved in
  // JavaScript, so the server always rendered the dark variant and a light-mode
  // visitor saw near-invisible buttons until hydration finished — or forever,
  // if it failed. CSS custom properties already carry the right value for each
  // theme without running anything.
  const btnSecondary = {
    background: 'var(--mat-liquid-bg)',
    border:     '1px solid var(--mat-liquid-border)',
    color:      'var(--text-secondary)',
  };

  const lbl = {
    confirmed:  isRtl ? 'تم تأكيد تسجيلك' : lang === 'tr' ? 'Kaydınız onaylandı' : 'Registration Confirmed',
    attendee:   isRtl ? 'المشارك'           : lang === 'tr' ? 'Katılımcı'          : 'Attendee',
    trackLabel: isRtl ? 'المسار'            : lang === 'tr' ? 'Alan'               : 'Track',
    orgLabel:   isRtl ? 'الجهة'             : lang === 'tr' ? 'Kuruluş'            : 'Organization',
    dateLabel:  isRtl ? 'التاريخ'           : lang === 'tr' ? 'Tarih'              : 'Date',
    venueLabel: isRtl ? 'المكان'            : lang === 'tr' ? 'Mekan'              : 'Venue',
    codeLabel:  isRtl ? 'رمز التأكيد'       : lang === 'tr' ? 'Onay Kodu'          : 'Confirmation Code',
    scanHint:   isRtl ? 'امسح هذا الرمز عند الدخول' : lang === 'tr' ? 'Girişte bu kodu okutun' : 'Scan at the entrance',
    pdfBtn:     isRtl ? 'تحميل الشارة'      : lang === 'tr' ? 'Rozeti İndir'       : 'Download Badge',
    copyBtn:    copyLabel ?? (isRtl ? 'نسخ الرابط' : lang === 'tr' ? 'Linki Kopyala' : 'Copy Link'),
    copiedBtn:  isRtl ? 'تم النسخ!'         : lang === 'tr' ? 'Kopyalandı!'        : 'Copied!',
    // Where "back" goes depends on where the badge is shown: the public
    // confirmation page came from the marketing site, but an attendee looking
    // at it inside their dashboard should not be ejected out to the homepage.
    backBtn:    backLabel ?? (isRtl ? 'الرئيسية' : lang === 'tr' ? 'Ana Sayfa' : 'Home'),
  };


  return (
    <>
      {/* Print CSS — kept for browser-print fallback only */}
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 6mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #cic-badge, #cic-badge * { visibility: visible !important; }
          .badge-no-print { display: none !important; }
          #cic-badge { position: fixed !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        }
      `}</style>

      <div id="cic-badge" className="flex flex-col items-center w-full">

        {/* ── THE TICKET ─────────────────────────────────────────────── */}
        {/* Entrance is CSS, not framer-motion: an `initial` opacity of 0 left
            the pass invisible rather than unanimated when the JS failed. */}
        <div
          id="cic-badge-card"
          dir={dir}
          className="badge-rise w-full overflow-hidden"
          style={{
            /* Standard conference badge: 3.375" × 5.375" at 96dpi = 324 × 516px */
            width: 324,
            maxWidth: '100%',
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* ── Dark header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '12px 20px 14px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle dot pattern */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }} />

            {/* Gradient glow orb — left side */}
            <div style={{
              position: 'absolute', top: -30, left: -30, width: 130, height: 130,
              borderRadius: '50%', opacity: 0.18,
              background: `radial-gradient(circle, ${accent.to}, transparent)`,
            }} />

            {/* Logo row */}
            <div style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logos/card_logo.png"
                alt="CIC"
                style={{ height: 36, width: 'auto', objectFit: 'contain', maxWidth: '70%' }}
              />
              <span style={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: 18, fontWeight: 700,
                letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                2026
              </span>
            </div>

          </div>

          {/* ── Attendee body ── */}
          <div style={{ padding: '16px 20px 0' }}>

            {/* Top row: label+name on right · pill on left */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
            }}>
              {/* Right: label + name */}
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <p style={{
                  color: '#94a3b8', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  margin: '0 0 6px',
                }}>
                  {lbl.attendee}
                </p>
                <h1 style={{
                  fontSize: 30, fontWeight: 900, color: '#0f172a',
                  lineHeight: 1.1, margin: 0,
                  letterSpacing: isRtl ? 0 : '-0.02em',
                }}>
                  {name || '—'}
                </h1>
              </div>

              {/* Left: category pill */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 16px',
                borderRadius: 99, flexShrink: 0, marginTop: 2,
                background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{categoryLabel}</span>
              </div>
            </div>

            {/* Org */}
            {organization && (
              <p style={{
                color: '#64748b', fontSize: 13, marginBottom: 6,
                textAlign: isRtl ? 'right' : 'left',
              }}>
                {organization}
              </p>
            )}

            {/* Track — right-aligned in RTL, label before value */}
            {track && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28,
                justifyContent: 'flex-start',
              }}>
                <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {lbl.trackLabel}:
                </span>
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>{track}</span>
              </div>
            )}
          </div>

          {/* ── Cutting line ── */}
          <div style={{ margin: '0 20px', borderTop: '2px dashed #e2e8f0' }} />

          {/* ── Event details ── */}
          <div style={{ padding: '12px 20px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 3px' }}>
                  {lbl.dateLabel}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                  <Calendar size={12} color={accent.from} />
                  <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{date}</span>
                </div>
              </div>
              <div style={{ width: 1, background: '#e2e8f0', margin: '0 16px' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 3px' }}>
                  {lbl.venueLabel}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                  <MapPin size={12} color={accent.to} />
                  <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scan block ──
              The QR is the badge's working part: it is what the door scanner
              reads, and it carries a signed token rather than the printed code,
              so a photographed badge cannot be turned into somebody else's.
              The code stays beside it in plain text because the desk still has
              to be able to find a person when a screen is too dim to scan. */}
          <div style={{ padding: '10px 20px 18px', background: '#f8fafc' }}>
            <div style={{
              background: '#fff', borderRadius: 10,
              padding: qrValue ? 12 : '12px 12px 10px',
              border: '1px solid #e2e8f0',
            }}>
              {qrValue ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                }}>
                  <QRCode value={qrValue} size={84} margin={1} title={lbl.codeLabel} />

                  <div style={{ minWidth: 0, textAlign: isRtl ? 'right' : 'left' }}>
                    <p style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 4px' }}>
                      {lbl.codeLabel}
                    </p>
                    <p style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 800, color: '#334155', letterSpacing: '0.08em', margin: 0, wordBreak: 'break-all' }}>
                      {code}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: 10, margin: '6px 0 0', lineHeight: 1.4 }}>
                      {lbl.scanHint}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <BarcodeSVG code={code} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 8, flexDirection: isRtl ? 'row-reverse' : 'row',
                  }}>
                    <span style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                      {lbl.codeLabel}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: '#334155', letterSpacing: '0.1em' }}>
                      {code}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Bottom gradient strip ── */}
          <div style={{ height: 5, background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${accent.from}, ${accent.to})` }} />
        </div>

        {/* ── ACTION BUTTONS — outside the ticket ──────────────────── */}
        <div
          className="badge-no-print badge-actions-rise"
          dir={dir}
          style={{ width: '100%', maxWidth: 324, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {/* Download */}
          <button
            onClick={onDownloadPDF}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '13px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              color: '#fff', fontWeight: 700, fontSize: 14,
              flexDirection: isRtl ? 'row-reverse' : 'row',
              boxShadow: `0 4px 20px ${accent.from}40`,
            }}
          >
            <Download size={16} />
            {lbl.pdfBtn}
          </button>

          {/* Copy + Back row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.button
                key={copied ? 'copied' : 'copy'}
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: 0.14 }}
                onClick={onCopyLink}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '11px 16px', borderRadius: 14, cursor: 'pointer',
                  background: copied ? '#f0fdf4' : btnSecondary.background,
                  border: copied ? '1px solid #86efac' : btnSecondary.border,
                  color: copied ? '#16a34a' : btnSecondary.color,
                  fontWeight: 600, fontSize: 13,
                  flexDirection: isRtl ? 'row-reverse' : 'row',
                }}
              >
                {copied
                  ? <><CircleCheck size={15} />{lbl.copiedBtn}</>
                  : <><Copy size={15} />{lbl.copyBtn}</>}
              </motion.button>
            </AnimatePresence>

            <Link
              href={backHref}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '11px 16px', borderRadius: 14, textDecoration: 'none',
                background: btnSecondary.background,
                border: btnSecondary.border,
                color: btnSecondary.color,
                fontWeight: 600, fontSize: 13,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              }}
            >
              <ArrowRight size={14} style={{ transform: isRtl ? 'scaleX(-1)' : undefined }} />
              {lbl.backBtn}
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}
