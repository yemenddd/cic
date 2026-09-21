'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A ring that fills to a value.
 *
 * Drawn by hand rather than pulled from a charting library. The three figures
 * on the dashboard are one arc, one donut and a row of bars, and the smallest
 * library that draws them would add several hundred kilobytes to every
 * serverless bundle on a project already at two-thirds of its storage. An SVG
 * circle with a dash offset is the whole technique.
 *
 * The sweep is animated from empty on first paint, which is what makes a
 * figure read as measured rather than typed — but only once it is on screen,
 * so a ring further down the page is not already finished by the time it is
 * scrolled to. Honoured against `prefers-reduced-motion`.
 */

export interface GaugeProps {
  /** 0–1. Clamped, so a bad ratio cannot draw a ring round more than once. */
  value: number;
  /** Large number in the middle. */
  label: string;
  /** Small caption under it. */
  caption?: string;
  size?: number;
  thickness?: number;
  /** Any CSS colour — a var(--accent-…) or a gradient's solid fallback. */
  color?: string;
  /** Reads the ring out to a screen reader, which cannot see the arc at all. */
  ariaLabel: string;
}

export default function Gauge({
  value,
  label,
  caption,
  size = 92,
  thickness = 7,
  color = 'var(--accent-cyan)',
  ariaLabel,
}: GaugeProps) {
  const safe = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

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
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A three-quarter arc, opened at the bottom. A full ring has no beginning,
  // so there is nothing to read "empty" as — this one has a visible start and
  // end, and an empty gauge still looks like a gauge.
  const SWEEP = 0.75;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * SWEEP;

  return (
    <div
      ref={hostRef}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {/* Rotated so the gap sits at the bottom centre. */}
        <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--mat-liquid-bg)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${arc * (shown ? safe : 0)} ${circumference}`}
            style={{
              transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </g>
      </svg>

      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-outfit font-bold leading-none"
          style={{ fontSize: size * 0.26, color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {caption && (
          <span
            className="mt-1 leading-none"
            style={{ fontSize: size * 0.125, color: 'var(--text-tertiary)' }}
          >
            {caption}
          </span>
        )}
      </span>
    </div>
  );
}
