'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Check, CircleCheck, Download, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

// ── Category accent colors ──────────────────────────────────────────────────
const CATEGORY_ACCENT: Record<string, { from: string; to: string; light: string }> = {
  visitor:     { from: '#0891b2', to: '#06b6d4', light: '#ecfeff' },
  participant: { from: '#7c3aed', to: '#8b5cf6', light: '#f5f3ff' },
  volunteer:   { from: '#059669', to: '#10b981', light: '#ecfdf5' },
};
const DEFAULT_ACCENT = { from: '#1e40af', to: '#3b82f6', light: '#eff6ff' };

// ── Deterministic barcode from code string ──────────────────────────────────
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
  bars.forEach((w, i) => {
    rects.push({ x, w, tall: i % 7 !== 0 });
    x += w + 1.5;
  });
  const totalW = x;

  return (
    <svg width="100%" height="44" viewBox={`0 0 ${totalW} 44`} preserveAspectRatio="none">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.tall ? 0 : 4} width={r.w} height={r.tall ? 44 : 36}
          fill="#1e293b" opacity={r.tall ? 1 : 0.55} />
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

  const label = {
    attendee:   isRtl ? 'المشارك'    : lang === 'tr' ? 'Katılımcı'   : 'Attendee',
    confirmed:  isRtl ? 'تم تأكيد تسجيلك' : lang === 'tr' ? 'Kaydınız onaylandı' : 'Registration confirmed',
    trackLabel: isRtl ? 'المسار'      : lang === 'tr' ? 'Alan'        : 'Track',
    codeLabel:  isRtl ? 'رمز التأكيد' : lang === 'tr' ? 'Onay Kodu'  : 'Confirmation Code',
    pdfBtn:     isRtl ? 'تحميل PDF'  : lang === 'tr' ? 'PDF İndir'   : 'Download PDF',
    copyBtn:    isRtl ? 'نسخ الرابط' : lang === 'tr' ? 'Linki Kopyala' : 'Copy Link',
    copiedBtn:  isRtl ? 'تم النسخ!'  : lang === 'tr' ? 'Kopyalandı!' : 'Copied!',
    backBtn:    isRtl ? 'العودة للرئيسية' : lang === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home',
    edition:    isRtl ? 'النسخة الرابعة · 2026' : lang === 'tr' ? '4. Baskı · 2026' : '4th Edition · 2026',
  };

  return (
    <>
      {/* ── Print CSS ─────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page { size: A6 portrait; margin: 3mm; }

          /* Force browser to print background colours and gradients */
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body { overflow: hidden !important; height: 100% !important; }

          /* Hide everything on the page … */
          body * { visibility: hidden !important; }

          /* … then reveal the badge and all its children */
          #cict-badge, #cict-badge * { visibility: visible !important; }

          /* Buttons/footer: truly remove from layout so they don't push to page 2 */
          #cict-badge .badge-no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Centre the badge on the A6 sheet */
          #cict-badge {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Reset Framer Motion transform + give card a cut-line border */
          #cict-badge > div {
            transform: none !important;
            box-shadow: none !important;
            width: 96mm !important;
            max-width: 96mm !important;
            border-radius: 3mm !important;
            border: 0.4mm solid #cbd5e1 !important;
          }
        }
      `}</style>

      <div id="cict-badge" className="flex items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE }}
          id="cict-badge-card"
          dir={isRtl ? 'rtl' : 'ltr'}
          className="w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          style={{ maxWidth: 380, background: '#ffffff' }}
        >
          {/* ── Top gradient accent bar ──────────────────────────────── */}
          <div className="relative h-10 w-full flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
            {/* Subtle geometric pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
            {/* Hole punch circle */}
            <div className="relative z-10 h-5 w-5 rounded-full bg-white shadow-inner ring-1 ring-black/10" />
          </div>

          {/* ── Conference header ────────────────────────────────────── */}
          <div className={cn('flex items-center gap-3 px-6 pt-5 pb-4', isRtl ? 'flex-row-reverse' : '')}>
            {/* Logo mark */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
              <span className="text-base font-black tracking-tighter">CI</span>
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-slate-800">CICT 2026</p>
              <p className="text-[11px] text-slate-400">{label.edition}</p>
            </div>
          </div>

          {/* ── Gradient divider ─────────────────────────────────────── */}
          <div className="mx-6 h-px" style={{ background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${accent.from}40, ${accent.to}40, transparent)` }} />

          {/* ── Attendee info ────────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-4">
            {/* Status row */}
            <div className={cn('flex items-center gap-1.5 mb-3', isRtl ? 'flex-row-reverse' : '')}>
              <Check className="h-3.5 w-3.5" style={{ color: accent.from }} strokeWidth={3} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent.from }}>
                {label.confirmed}
              </span>
            </div>

            {/* Label */}
            <p className={cn('text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1.5', isRtl && 'text-right')}>
              {label.attendee}
            </p>

            {/* Name — hero element */}
            <h1 className={cn('text-[26px] font-black leading-tight text-slate-900 mb-4', isRtl ? 'text-right' : 'text-left')}
              style={{ letterSpacing: isRtl ? '0' : '-0.01em' }}>
              {name || '—'}
            </h1>

            {/* Category pill — color-coded */}
            <div
              className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 mb-3 text-sm font-bold text-white w-full justify-center', isRtl && 'flex-row-reverse')}
              style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
            >
              <span className="h-2 w-2 rounded-full bg-white/60" />
              {categoryLabel}
            </div>

            {/* Organization */}
            {organization && (
              <p className={cn('text-xs text-slate-500 mb-1 truncate', isRtl ? 'text-right' : 'text-left')}>
                {organization}
              </p>
            )}

            {/* Track */}
            {track && (
              <div className={cn('flex items-center gap-1.5 mb-1', isRtl ? 'flex-row-reverse' : '')}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label.trackLabel}:</span>
                <span className="text-[12px] font-medium text-slate-600">{track}</span>
              </div>
            )}
          </div>

          {/* ── Divider ──────────────────────────────────────────────── */}
          <div className="mx-6 h-px bg-slate-100" />

          {/* ── Event details ────────────────────────────────────────── */}
          <div className="px-6 py-4 flex flex-col gap-1.5">
            <div className={cn('flex items-center gap-2 text-[12px] text-slate-600', isRtl ? 'flex-row-reverse' : '')}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent.from }} />
              <span>{date}</span>
            </div>
            <div className={cn('flex items-center gap-2 text-[12px] text-slate-600', isRtl ? 'flex-row-reverse' : '')}>
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent.to }} />
              <span>{location}</span>
            </div>
          </div>

          {/* ── Barcode + code ───────────────────────────────────────── */}
          <div className="mx-6 mb-2 rounded-xl border border-slate-100 bg-slate-50 px-4 pt-3 pb-2">
            <BarcodeSVG code={code} />
            <div className={cn('mt-2 flex items-center justify-between', isRtl ? 'flex-row-reverse' : '')}>
              <span className="text-[9px] uppercase tracking-widest text-slate-400">{label.codeLabel}</span>
              <span className="font-mono text-[11px] font-bold tracking-widest text-slate-700">{code}</span>
            </div>
          </div>

          {/* ── Bottom watermark strip ───────────────────────────────── */}
          <div className="mx-6 mb-5 overflow-hidden rounded-b-lg">
            <div className="h-1 w-full" style={{ background: `linear-gradient(to ${isRtl ? 'left' : 'right'}, ${accent.from}, ${accent.to})` }} />
          </div>

          {/* ── Action buttons (hidden on print) ─────────────────────── */}
          <div className="badge-no-print px-6 pb-5 flex gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
            <button
              onClick={onDownloadPDF}
              className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]', isRtl && 'flex-row-reverse')}
              style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
            >
              <Download className="h-4 w-4" />
              {label.pdfBtn}
            </button>

            <AnimatePresence mode="wait">
              <motion.button
                key={copied ? 'copied' : 'copy'}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15 }}
                onClick={onCopyLink}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-semibold transition-all active:scale-[0.97]',
                  isRtl && 'flex-row-reverse',
                  copied
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {copied
                  ? <><CircleCheck className="h-4 w-4" />{label.copiedBtn}</>
                  : <><Copy className="h-4 w-4" />{label.copyBtn}</>
                }
              </motion.button>
            </AnimatePresence>
          </div>

          {/* ── Footer nav ───────────────────────────────────────────── */}
          <div className={cn('badge-no-print flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3', isRtl ? 'flex-row-reverse' : '')}>
            <Link href="/" className={cn('flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors', isRtl && 'flex-row-reverse')}>
              <ArrowRight className={cn('h-3 w-3', isRtl && 'rotate-180')} />
              {label.backBtn}
            </Link>
            <span className="font-mono text-[9px] text-slate-300">{code}</span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
