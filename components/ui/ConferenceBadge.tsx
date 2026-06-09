'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Check, CircleCheck, Download, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ConferenceBadge({
  name, categoryId, categoryLabel, organization, track,
  code, date, location, lang,
  onDownloadPDF, onCopyLink, copied,
}: BadgeProps) {
  const isRtl = lang === 'ar';
  const accent = CATEGORY_ACCENT[categoryId] ?? DEFAULT_ACCENT;
  const dir = isRtl ? 'rtl' : 'ltr';

  const lbl = {
    confirmed:  isRtl ? 'تم تأكيد تسجيلك' : lang === 'tr' ? 'Kaydınız onaylandı' : 'Registration Confirmed',
    attendee:   isRtl ? 'المشارك'           : lang === 'tr' ? 'Katılımcı'          : 'Attendee',
    trackLabel: isRtl ? 'المسار'            : lang === 'tr' ? 'Alan'               : 'Track',
    orgLabel:   isRtl ? 'الجهة'             : lang === 'tr' ? 'Kuruluş'            : 'Organization',
    dateLabel:  isRtl ? 'التاريخ'           : lang === 'tr' ? 'Tarih'              : 'Date',
    venueLabel: isRtl ? 'المكان'            : lang === 'tr' ? 'Mekan'              : 'Venue',
    codeLabel:  isRtl ? 'رمز التأكيد'       : lang === 'tr' ? 'Onay Kodu'          : 'Confirmation Code',
    edition:    isRtl ? 'النسخة الرابعة · 2026' : lang === 'tr' ? '4. Baskı · 2026' : '4th Edition · 2026',
    pdfBtn:     isRtl ? 'تحميل الشارة'      : lang === 'tr' ? 'Rozeti İndir'       : 'Download Badge',
    copyBtn:    isRtl ? 'نسخ الرابط'        : lang === 'tr' ? 'Linki Kopyala'      : 'Copy Link',
    copiedBtn:  isRtl ? 'تم النسخ!'         : lang === 'tr' ? 'Kopyalandı!'        : 'Copied!',
    backBtn:    isRtl ? 'الرئيسية'          : lang === 'tr' ? 'Ana Sayfa'          : 'Home',
  };

  const row = (reverse = false) =>
    `flex items-center gap-2${reverse ? ' flex-row-reverse' : ''}`;

  return (
    <>
      {/* Print CSS — kept for browser-print fallback only */}
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 6mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          #cict-badge, #cict-badge * { visibility: visible !important; }
          .badge-no-print { display: none !important; }
          #cict-badge { position: fixed !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        }
      `}</style>

      <div id="cict-badge" className="flex flex-col items-center w-full">

        {/* ── THE TICKET ─────────────────────────────────────────────── */}
        <motion.div
          id="cict-badge-card"
          dir={dir}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="w-full overflow-hidden"
          style={{
            maxWidth: 400,
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {/* ── Dark header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '22px 24px 20px',
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

            {/* Header row: Logo+Name on right · 2026 on left */}
            <div style={{
              position: 'relative', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {/* Logo + conference name */}
              <div className={row(isRtl)} style={{ gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logos/logo_white.png"
                  alt="CICT"
                  style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.3 }}>
                    {isRtl ? 'مؤتمر الإبداع والابتكار' : lang === 'tr' ? 'Yaratıcılık ve İnovasyon' : 'Creativity & Innovation'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0 }}>
                    {isRtl ? 'النسخة الرابعة' : lang === 'tr' ? '4. Baskı' : '4th Edition'}
                  </p>
                </div>
              </div>

              {/* Year — opposite side */}
              <span style={{
                color: 'rgba(255,255,255,0.22)',
                fontSize: 28, fontWeight: 900,
                letterSpacing: '-0.02em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                2026
              </span>
            </div>

            {/* Confirmed badge */}
            <div className={row(isRtl)}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                gap: 6, padding: '5px 10px 5px 8px',
                borderRadius: 999,
                background: 'rgba(6,182,212,0.15)',
                border: '1px solid rgba(6,182,212,0.3)',
              }}>
                <Check size={12} color="#67e8f9" strokeWidth={3} />
                <span style={{ color: '#67e8f9', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
                  {lbl.confirmed}
                </span>
              </div>
            </div>
          </div>

          {/* ── Attendee body ── */}
          <div style={{ padding: '20px 24px 0' }}>
            <p style={{
              color: '#94a3b8', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              marginBottom: 6, textAlign: isRtl ? 'right' : 'left',
            }}>
              {lbl.attendee}
            </p>

            <h1 style={{
              fontSize: 26, fontWeight: 900, color: '#0f172a',
              lineHeight: 1.15, margin: '0 0 16px',
              textAlign: isRtl ? 'right' : 'left',
              letterSpacing: isRtl ? 0 : '-0.02em',
            }}>
              {name || '—'}
            </h1>

            {/* Category pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 16px',
              borderRadius: 10, marginBottom: 14,
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
              flexDirection: isRtl ? 'row-reverse' : 'row',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{categoryLabel}</span>
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

            {/* Track */}
            {track && (
              <div className={row(isRtl)} style={{ marginBottom: 20 }}>
                <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {lbl.trackLabel}:
                </span>
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>{track}</span>
              </div>
            )}
          </div>

          {/* ── Perforated divider ── */}
          <div style={{ position: 'relative', margin: '0 0', padding: '0 24px' }}>
            <div style={{ borderTop: '2px dashed #e2e8f0' }} />
            {/* Circle cutouts */}
            <div style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              width: 22, height: 22, borderRadius: '50%',
              background: '#f1f5f9', border: '2px dashed #e2e8f0',
            }} />
            <div style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              width: 22, height: 22, borderRadius: '50%',
              background: '#f1f5f9', border: '2px dashed #e2e8f0',
            }} />
          </div>

          {/* ── Event details ── */}
          <div style={{ padding: '16px 24px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', gap: 0, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 3px' }}>
                  {lbl.dateLabel}
                </p>
                <div className={row(isRtl)}>
                  <Calendar size={12} color={accent.from} />
                  <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{date}</span>
                </div>
              </div>
              <div style={{ width: 1, background: '#e2e8f0', margin: '0 16px' }} />
              <div style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
                <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 3px' }}>
                  {lbl.venueLabel}
                </p>
                <div className={row(isRtl)}>
                  <MapPin size={12} color={accent.to} />
                  <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Barcode ── */}
          <div style={{ padding: '14px 24px 22px', background: '#f8fafc' }}>
            <div style={{
              background: '#fff', borderRadius: 10,
              padding: '12px 12px 10px',
              border: '1px solid #e2e8f0',
            }}>
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
            </div>
          </div>

          {/* ── Bottom gradient strip ── */}
          <div style={{ height: 5, background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${accent.from}, ${accent.to})` }} />
        </motion.div>

        {/* ── ACTION BUTTONS — outside the ticket ──────────────────── */}
        <motion.div
          className="badge-no-print"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          dir={dir}
          style={{ width: '100%', maxWidth: 400, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
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
            <AnimatePresence mode="wait">
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
                  background: copied ? '#f0fdf4' : 'rgba(255,255,255,0.07)',
                  border: copied ? '1px solid #86efac' : '1px solid rgba(255,255,255,0.15)',
                  color: copied ? '#16a34a' : 'rgba(255,255,255,0.75)',
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
              href="/"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: '11px 16px', borderRadius: 14, textDecoration: 'none',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: 13,
                flexDirection: isRtl ? 'row-reverse' : 'row',
              }}
            >
              <ArrowRight size={14} style={{ transform: isRtl ? 'scaleX(-1)' : undefined }} />
              {lbl.backBtn}
            </Link>
          </div>
        </motion.div>

      </div>
    </>
  );
}
