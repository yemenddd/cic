'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Where an attendee's projects stand, as one bar rather than a list of counts.
 *
 * The list this replaces gave a number per status and left the reading to the
 * viewer — the useful fact about four projects is not "1, 2, 1" but how much of
 * the bar is still waiting on somebody else. Proportions are what a bar shows
 * and a column of figures does not.
 *
 * The segments keep their own labels underneath: a bar alone is unreadable to
 * anyone who cannot distinguish the colours, and at these counts the exact
 * numbers still matter.
 */

export interface StatusSlice {
  key: string;
  label: string;
  count: number;
  color: string;
}

export default function StatusBar({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const hostRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !hostRef.current || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const el = hostRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (total === 0) return null;

  return (
    <div ref={hostRef}>
      <div
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
        style={{ background: 'var(--mat-liquid-bg)' }}
        role="img"
        aria-label={`توزيع مشاريعك: ${slices
          .filter((s) => s.count > 0)
          .map((s) => `${s.label} ${s.count}`)
          .join('، ')}`}
      >
        {slices
          .filter((s) => s.count > 0)
          .map((s) => (
            <span
              key={s.key}
              className="h-full first:rounded-s-full last:rounded-e-full"
              style={{
                width: shown ? `${(s.count / total) * 100}%` : '0%',
                background: s.color,
                transition: 'width 800ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {slices
          .filter((s) => s.count > 0)
          .map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-3">
              <span
                className="flex items-center gap-2.5 text-[13px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: s.color }}
                  aria-hidden
                />
                {s.label}
              </span>
              <span
                className="font-outfit font-bold text-[14px] tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {s.count}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
