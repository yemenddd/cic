'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { downloadCertificatePDF } from '@/lib/download-certificate-pdf';
import { arabicCountBare, HOUR } from '@/lib/arabic-plural';

/* A4 landscape proportions (297 × 210 mm → 1.414). Fixed pixel dimensions so
   the rasterised capture is deterministic; the on-screen copy is scaled down
   by a wrapper, never by the captured node itself. */
const CERT_W = 1000;
const CERT_H = 707;

/* The certificate face is always a printed-light document: it carries its own
   parchment palette and never reads from the theme tokens. Only the page
   chrome around it follows light/dark. */
const INK = '#16233f';
const INK_SOFT = '#44506b';
const GOLD = '#a8863c';
const GOLD_SOFT = '#d8c489';
const PARCHMENT = '#fdfbf4';

/* Every text node inside the capture uses the same stack the platform shells
   apply through `.font-platform` — IBM Plex Sans Arabic. It is the face the
   badge export already rasterises correctly, and it is declared here directly
   rather than inherited so the capture can never fall back to a system font
   that shapes Arabic differently. */
const FONT_STACK = "var(--font-ibm), 'IBM Plex Sans Arabic', system-ui, sans-serif";

export interface ParticipationCertificateProps {
  name: string;
  categoryId: string;
  categoryLabel: string;
  track?: string;
  code: string;
  date: string;
  location: string;
  /** Registration date, already formatted as a plain Arabic string server-side. */
  issuedAt: string;
  /**
   * Draw it, but do not issue it.
   *
   * Used before the conference has happened, so somebody can see their own
   * name and track set on the real document and correct them while there is
   * still time — the page has always told them to check those values and then
   * shown a list, which is not the same thing at all.
   *
   * It also withholds the capture id. `downloadCertificatePDF` finds its
   * target by the hardcoded `cic-certificate`, so a preview that kept the id
   * would be a certificate anybody could save early by calling the helper from
   * a console — which is the one thing the whole "issued only after the event"
   * rule exists to prevent.
   */
  preview?: boolean;
  /**
   * Hours on the volunteer rota, summed server-side.
   *
   * Only meaningful for the volunteer tier, whose certificate is the one that
   * has to say how much work it attests to.
   */
  volunteerHours?: number;
}

function wording(
  categoryId: string,
  categoryLabel: string,
  date: string,
  location: string,
  volunteerHours?: number,
) {
  const isVolunteer = categoryId === 'volunteer';

  // The hours are what turns "شهادة تطوع معتمدة" from a title into a document
  // that says something — an employer or a university reads the number, not
  // the adjective. Stated only when there are hours on the rota to state:
  // a volunteer who worked no recorded shift gets the sentence without a
  // figure rather than a certificate claiming zero.
  //
  // Counted through the shared helper: Arabic has four forms, and "2 ساعتين"
  // — which is what writing the number in by hand produces — carries the two
  // twice.
  const service = volunteerHours && volunteerHours > 0
    ? ` بواقع ${arabicCountBare(volunteerHours, HOUR)} من العمل التنظيمي،`
    : '';

  return {
    title: isVolunteer ? 'شهادة تطوع' : 'شهادة مشاركة',
    titleEn: isVolunteer ? 'CERTIFICATE OF VOLUNTEERING' : 'CERTIFICATE OF PARTICIPATION',
    body: isVolunteer
      ? `قد ساهم ضمن الفريق التطوعي لمؤتمر الإبداع والابتكار 2026، المنعقد يومي ${date} في ${location}،${service} وأدّى مهامه التنظيمية بالتزام وتفانٍ يستحقان التقدير.`
      : `قد شارك في فعاليات مؤتمر الإبداع والابتكار 2026، المنعقد يومي ${date} في ${location}، بصفة ${categoryLabel || 'زائر'}.`,
    kindLabel: isVolunteer ? 'صفة التطوع' : 'صفة المشاركة',
  };
}

/** Small L-shaped ornament pinned to one corner of the inner frame. */
function CornerMark({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top = corner === 'tl' || corner === 'tr';
  const left = corner === 'tl' || corner === 'bl';

  return (
    <div
      style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: -1,
        [left ? 'left' : 'right']: -1,
        width: 34,
        height: 34,
        [top ? 'borderTop' : 'borderBottom']: `3px solid ${GOLD}`,
        [left ? 'borderLeft' : 'borderRight']: `3px solid ${GOLD}`,
      } as React.CSSProperties}
    />
  );
}

/** Centred rule with a diamond in the middle — the divider under the title. */
function Flourish({ width = 300 }: { width?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width, margin: '0 auto' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD_SOFT})` }} />
      <div style={{ width: 7, height: 7, background: GOLD, transform: 'rotate(45deg)' }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD_SOFT})` }} />
    </div>
  );
}

export default function ParticipationCertificate({
  name, categoryId, categoryLabel, track, code, date, location, issuedAt, preview = false,
  volunteerHours,
}: ParticipationCertificateProps) {
  const w = wording(categoryId, categoryLabel, date, location, volunteerHours);

  // Scale the on-screen copy to fit narrow viewports. The transform lives on a
  // wrapper, never on #cic-certificate, so the capture stays at full size.
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / CERT_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDownload = useCallback(() => { void downloadCertificatePDF(name || 'CIC-Certificate'); }, [name]);

  return (
    <div style={{ width: '100%' }}>
      <div ref={measureRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {/* Clip box at the scaled size, so the shrunken sheet takes real layout space. */}
        <div dir="ltr" style={{ width: CERT_W * scale, height: CERT_H * scale, overflow: 'hidden' }}>
          <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}>

            {/* ── THE CERTIFICATE ─────────────────────────────────────── */}
            <div
              // Withheld in preview, so the PDF helper cannot find it.
              id={preview ? undefined : 'cic-certificate'}
              dir="rtl"
              style={{
                width: CERT_W,
                height: CERT_H,
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
                padding: 22,
                background: PARCHMENT,
                backgroundImage:
                  `radial-gradient(circle at 50% 0%, rgba(168,134,60,0.07), transparent 58%),` +
                  `radial-gradient(circle at 50% 100%, rgba(22,35,63,0.05), transparent 55%)`,
                fontFamily: FONT_STACK,
                color: INK,
                boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
                border: `2px solid ${GOLD}`,
              }}
            >
              {/* Inner frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${GOLD_SOFT}`,
                  padding: '30px 64px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <CornerMark corner="tl" />
                <CornerMark corner="tr" />
                <CornerMark corner="bl" />
                <CornerMark corner="br" />

                {/* ── Header: logo + conference line ── */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logos/logo.png"
                  alt="CIC"
                  style={{ height: 62, width: 'auto', objectFit: 'contain', marginBottom: 10 }}
                />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: INK_SOFT, letterSpacing: '0.01em' }}>
                  مؤتمر الإبداع والابتكار الرابع
                </p>
                <p
                  dir="ltr"
                  style={{
                    margin: '3px 0 0', fontSize: 10.5, fontWeight: 600, color: GOLD,
                    letterSpacing: '0.34em', textTransform: 'uppercase',
                  }}
                >
                  CIC 2026 · Istanbul
                </p>

                {/* ── Title ── */}
                <h1 style={{ margin: '20px 0 0', fontSize: 50, fontWeight: 700, lineHeight: 1.15, color: INK }}>
                  {w.title}
                </h1>
                <p
                  dir="ltr"
                  style={{
                    margin: '7px 0 14px', fontSize: 10, fontWeight: 600, color: INK_SOFT,
                    letterSpacing: '0.3em',
                  }}
                >
                  {w.titleEn}
                </p>
                <Flourish width={330} />

                {/* ── Citation ── */}
                <p style={{ margin: '22px 0 0', fontSize: 15, color: INK_SOFT }}>
                  تشهد اللجنة المنظمة للمؤتمر بأنّ
                </p>

                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: 38,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: INK,
                    maxWidth: 800,
                    borderBottom: `1px solid ${GOLD_SOFT}`,
                    paddingBottom: 8,
                  }}
                >
                  {name || '—'}
                </p>

                <p style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.95, color: INK_SOFT, maxWidth: 760 }}>
                  {w.body}
                </p>

                {/* ── Category / track chips ── */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
                  <span
                    style={{
                      padding: '5px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                      color: INK, background: 'rgba(168,134,60,0.10)', border: `1px solid ${GOLD_SOFT}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.kindLabel}: {categoryLabel || '—'}
                  </span>
                  {track && (
                    <span
                      style={{
                        padding: '5px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                        color: INK, background: 'rgba(22,35,63,0.05)', border: '1px solid rgba(22,35,63,0.14)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      المسار: {track}
                    </span>
                  )}
                </div>

                {/* ── Footer: code · seal · signature ── */}
                <div
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 20,
                  }}
                >
                  {/* Verification code (start side in RTL = right) */}
                  <div style={{ textAlign: 'right', minWidth: 210 }}>
                    <p
                      style={{
                        margin: 0, fontSize: 9.5, fontWeight: 700, color: GOLD,
                        letterSpacing: '0.2em',
                      }}
                    >
                      رمز التحقق
                    </p>
                    <p
                      dir="ltr"
                      style={{
                        margin: '5px 0 0', fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                        color: INK, letterSpacing: '0.16em', textAlign: 'right',
                      }}
                    >
                      {code || '—'}
                    </p>
                    <p style={{ margin: '5px 0 0', fontSize: 10.5, color: INK_SOFT }}>
                      تاريخ التسجيل: {issuedAt}
                    </p>
                  </div>

                  {/* Seal */}
                  <div
                    style={{
                      width: 108, height: 108, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${GOLD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(168,134,60,0.05)',
                    }}
                  >
                    <div
                      style={{
                        width: 92, height: 92, borderRadius: '50%',
                        border: `1px dashed ${GOLD_SOFT}`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 1,
                      }}
                    >
                      <span dir="ltr" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.12em', color: INK }}>
                        CIC
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: GOLD, letterSpacing: '0.06em' }}>
                        ختم المؤتمر
                      </span>
                      <span dir="ltr" style={{ fontSize: 10.5, fontWeight: 600, color: INK_SOFT, letterSpacing: '0.1em' }}>
                        2026
                      </span>
                    </div>
                  </div>

                  {/* Signature */}
                  <div style={{ textAlign: 'left', minWidth: 210 }}>
                    <p
                      style={{
                        margin: 0, fontSize: 20, fontWeight: 700, color: INK,
                        fontStyle: 'italic', textAlign: 'center',
                      }}
                    >
                      اللجنة المنظمة
                    </p>
                    <div style={{ height: 1, background: INK_SOFT, opacity: 0.45, margin: '6px 0 6px' }} />
                    <p style={{ margin: 0, fontSize: 10.5, color: INK_SOFT, textAlign: 'center' }}>
                      التوقيع المعتمد · مؤتمر الإبداع والابتكار
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* ── END CERTIFICATE ─────────────────────────────────────── */}

            {/* Sits over the sheet, outside it, so nothing here is part of the
                document itself. A preview that merely looked faint would be
                screenshotted and passed off as the real thing; a band across
                the face cannot be mistaken, and it is honest about why —
                the certificate says in the past tense that its holder
                attended, and the conference has not happened yet. */}
            {preview && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {/* A corner ribbon, not a band across the middle.
                    The first version of this ran through the centre of the
                    sheet and landed squarely on the holder's name — on the one
                    page whose entire purpose is letting somebody proofread
                    that name before it is printed. The corner carries only
                    frame. */}
                <span
                  style={{
                    position: 'absolute',
                    top: 46,
                    left: -96,
                    width: 380,
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'center',
                    padding: '11px 0',
                    textAlign: 'center',
                    background: GOLD,
                    color: PARCHMENT,
                    fontFamily: FONT_STACK,
                    fontWeight: 800,
                    fontSize: 21,
                    letterSpacing: '0.04em',
                    boxShadow: '0 6px 22px rgba(22,35,63,0.28)',
                  }}
                >
                  معاينة · لم تصدر بعد
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Download action — excluded from the capture ── */}
      <div
        className="badge-no-print"
        dir="rtl"
        style={{ display: preview ? 'none' : 'flex', justifyContent: 'center', marginTop: 20 }}
      >
        <button
          onClick={handleDownload}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${INK}, #2b3f6b)`,
            color: '#fff', fontWeight: 700, fontSize: 14,
            flexDirection: 'row-reverse',
            boxShadow: '0 4px 20px rgba(22,35,63,0.28)',
          }}
        >
          <Download size={16} />
          تحميل الشهادة
        </button>
      </div>
    </div>
  );
}
