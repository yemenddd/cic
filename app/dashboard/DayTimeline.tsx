'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Bookmark, ArrowLeft } from 'lucide-react';

/**
 * The two conference days on a time axis, with this attendee's saved sessions
 * marked on it.
 *
 * The dashboard already said how many sessions were saved. A count answers the
 * wrong question: nobody wonders *how many* sessions they picked, they wonder
 * what their day looks like — when it starts, where the gaps are, whether two
 * things they saved collide. A number cannot show any of that and a strip
 * showing real start and end times shows all three at a glance.
 *
 * Laid out with CSS logical properties rather than SVG on purpose. The axis
 * runs right to left with the language, `inset-inline-start` resolves itself
 * against the RTL container, and the blocks stay real focusable elements that
 * a keyboard can reach and a screen reader can read — none of which comes free
 * inside an <svg>.
 */

export interface TimelineSession {
  id: string;
  day: string;
  time: string | null;
  titleAr: string;
  speakerNameAr: string | null;
  trackAr: string | null;
  /** Minutes from midnight, venue local time. Null when the time is free text
   *  we could not parse — those are listed under the axis instead of on it. */
  startMinutes: number | null;
  endMinutes: number | null;
  saved: boolean;
}

const DAY_LABELS: Record<string, string> = {
  dayOne: 'اليوم الأول',
  dayTwo: 'اليوم الثاني',
};

const HOUR = 60;

function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / HOUR);
  const m = minutes % HOUR;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function DayTimeline({
  sessions,
  hasSaved,
}: {
  sessions: TimelineSession[];
  hasSaved: boolean;
}) {
  const [active, setActive] = useState<TimelineSession | null>(null);

  // One axis for both days, so the two strips are directly comparable: a
  // session at 09:00 sits at the same place on each. Rounded outwards to the
  // hour, with an hour of air, so nothing is drawn flush against an edge.
  const { from, to, hours, days } = useMemo(() => {
    const placed = sessions.filter((s) => s.startMinutes !== null);
    const starts = placed.map((s) => s.startMinutes!);
    const ends = placed.map((s) => s.endMinutes ?? s.startMinutes! + 60);

    const lo = starts.length ? Math.floor(Math.min(...starts) / HOUR) * HOUR - HOUR : 8 * HOUR;
    const hi = ends.length ? Math.ceil(Math.max(...ends) / HOUR) * HOUR + HOUR : 18 * HOUR;

    const marks: number[] = [];
    for (let m = lo; m <= hi; m += HOUR) marks.push(m);

    const grouped = Object.keys(DAY_LABELS)
      .map((key) => ({ key, rows: sessions.filter((s) => s.day === key) }))
      .filter((g) => g.rows.length > 0);

    return { from: lo, to: hi, hours: marks, days: grouped };
  }, [sessions]);

  const span = Math.max(1, to - from);
  /** Distance from the start of the axis, as a percentage. In RTL the start is
   *  the right edge, which is what makes time read in the natural direction. */
  const offset = (minutes: number) => ((minutes - from) / span) * 100;

  const savedCount = sessions.filter((s) => s.saved).length;

  return (
    <section
      className="rounded-2xl p-5 md:p-6"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          يوماك في المؤتمر
        </h2>
        <Link
          href="/dashboard/agenda"
          className="inline-flex items-center gap-1 text-[12px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          عدّل جدولي
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mb-5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        {hasSaved
          ? `المحدَّد بلون المؤتمر ما حفظته — ${savedCount} من ${sessions.length}. المس أي جلسة لتفاصيلها.`
          : 'لم تحفظ جلسة بعد. هذا هو البرنامج كاملاً — المس أي جلسة لتفاصيلها.'}
      </p>

      <div className="space-y-5">
        {days.map(({ key, rows }) => {
          const placed = rows.filter((s) => s.startMinutes !== null);
          const unplaced = rows.filter((s) => s.startMinutes === null);
          const savedHere = rows.filter((s) => s.saved).length;

          return (
            <div key={key}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span
                  className="font-outfit font-bold text-[13px]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {DAY_LABELS[key] ?? key}
                </span>
                <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  {savedHere > 0 ? `${savedHere} من ${rows.length} محفوظة` : `${rows.length} جلسات`}
                </span>
              </div>

              {/* The axis. Height is fixed rather than derived from the blocks
                  so both days are the same size whatever they contain. */}
              {/* The track is --bg-base, not --mat-liquid-bg. That token is a
                  translucent white: over the card it lands near #232325 on the
                  dark theme and stays effectively white on the light one, so
                  the first version of this had blocks darker than their own
                  track in the dark and invisible in the light. --bg-base is a
                  real colour in both themes and reads as recessed in both. */}
              <div
                className="relative h-[62px] w-full overflow-hidden rounded-xl"
                style={{ background: 'var(--bg-base)' }}
              >
                {/* Hour rules, drawn under the blocks. */}
                {hours.map((m) => (
                  <span
                    key={m}
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px"
                    style={{
                      insetInlineStart: `${offset(m)}%`,
                      background: 'var(--mat-liquid-border)',
                    }}
                  />
                ))}

                {placed.map((s) => {
                  const start = s.startMinutes!;
                  const end = s.endMinutes ?? start + 60;
                  const width = Math.max(6, ((end - start) / span) * 100);
                  const isActive = active?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActive(isActive ? null : s)}
                      onMouseEnter={() => setActive(s)}
                      onFocus={() => setActive(s)}
                      title={`${s.time ?? clockLabel(start)} — ${s.titleAr}`}
                      aria-label={`${DAY_LABELS[key] ?? key}، ${s.time ?? clockLabel(start)}، ${s.titleAr}${s.saved ? '، محفوظة في جدولك' : ''}`}
                      aria-pressed={isActive}
                      className="absolute top-2 bottom-2 flex items-center justify-center gap-1 overflow-hidden rounded-lg px-1 transition-transform duration-150"
                      style={{
                        insetInlineStart: `${offset(start)}%`,
                        width: `${width}%`,
                        // Saved sessions carry the brand gradient; the rest are
                        // present but quiet, so the strip reads as "your day"
                        // without hiding what else is on.
                        background: s.saved ? 'var(--gradient-brand)' : 'var(--mat-liquid-bg)',
                        border: `1px solid ${s.saved ? 'transparent' : 'var(--mat-liquid-border)'}`,
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.28)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Hidden on a phone. A block is about 44px wide there,
                          and the icon plus its gap left roughly thirty for the
                          time — which clipped it to "...0" and cost the only
                          fact on the block to repeat something the colour
                          already says. The gradient differs from the flat chip
                          in lightness, not only in hue, so it survives being
                          seen in greyscale. */}
                      {s.saved && (
                        <Bookmark
                          className="hidden h-3 w-3 shrink-0 sm:block"
                          style={{ color: 'var(--primary-foreground)' }}
                          aria-hidden
                        />
                      )}
                      {/* The start time, on the block itself. Without it the
                          strip was a row of blank rounded rectangles that gave
                          up nothing until it was hovered — which is no use on a
                          phone, and no use at a glance on anything. */}
                      <span
                        aria-hidden
                        className="truncate text-[10.5px] font-semibold tabular-nums"
                        style={{
                          color: s.saved ? 'var(--primary-foreground)' : 'var(--text-secondary)',
                        }}
                      >
                        {clockLabel(start)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hour labels, outside the strip so they never sit under a block. */}
              <div className="relative mt-1 h-4">
                {hours.map((m, i) =>
                  // Every other hour on narrow screens would still collide, so
                  // the ends are dropped instead — they are the padding hours
                  // and carry no session.
                  i === 0 || i === hours.length - 1 ? null : (
                    <span
                      key={m}
                      aria-hidden
                      className="absolute top-0 -translate-x-1/2 text-[10px] tabular-nums rtl:translate-x-1/2"
                      style={{ insetInlineStart: `${offset(m)}%`, color: 'var(--text-tertiary)' }}
                    >
                      {clockLabel(m)}
                    </span>
                  ),
                )}
              </div>

              {unplaced.length > 0 && (
                <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  {unplaced.length === 1 ? 'جلسة واحدة' : `${unplaced.length} جلسات`} لم يُحدَّد وقتها
                  بعد: {unplaced.map((s) => s.titleAr).join(' · ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* The detail panel. Reserved height, so hovering along the strip does
          not make the page jump under the pointer. */}
      <div
        className="mt-5 rounded-xl p-4"
        style={{
          background: 'var(--mat-liquid-bg)',
          border: '1px solid var(--mat-liquid-border)',
          minHeight: 92,
        }}
        aria-live="polite"
      >
        {active ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--accent-cyan) 16%, transparent)',
                  color: 'var(--accent-cyan)',
                }}
              >
                {DAY_LABELS[active.day] ?? active.day}
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Clock className="h-3.5 w-3.5" />
                {active.time ??
                  (active.startMinutes !== null ? clockLabel(active.startMinutes) : 'يُحدَّد لاحقاً')}
              </span>
              {active.saved && (
                <span
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
                  style={{ color: 'var(--accent-violet)' }}
                >
                  <Bookmark className="h-3 w-3" />
                  في جدولك
                </span>
              )}
            </div>
            <p
              className="mt-2 font-outfit font-bold text-[14px] leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {active.titleAr}
            </p>
            {(active.speakerNameAr || active.trackAr) && (
              <p
                className="mt-1 inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <MapPin className="h-3.5 w-3.5" />
                {[active.speakerNameAr, active.trackAr].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        ) : (
          <p
            className="flex h-full items-center text-[12.5px] leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            مرّر على أي جلسة في الشريط أعلاه — أو المسها — لتظهر تفاصيلها هنا.
          </p>
        )}
      </div>
    </section>
  );
}
