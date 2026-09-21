'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Gauge from '@/components/platform/Gauge';

/**
 * The three figures worth watching, as rings.
 *
 * The third one is conditional, and that is the point. An attendee who has not
 * arrived yet has attended nothing, and a participant who has submitted
 * nothing has nothing under review — so a fixed row of three would open on a
 * zero for almost everybody who is early, which is the exact fault the welcome
 * hero was rebuilt to remove. The slot shows whichever measure currently means
 * something, and when none does the row is two.
 */

export interface RingStat {
  key: string;
  value: number;
  total: number;
  label: string;
  caption: string;
  href: string;
  color: string;
  /** Spelled out for a screen reader, which gets nothing from an arc. */
  ariaLabel: string;
}

export default function StatRings({ stats }: { stats: RingStat[] }) {
  if (stats.length === 0) return null;

  return (
    /* A fixed three-column track rather than one column per stat. Sized to the
       count, a lone ring stretched the full width of the page with its gauge
       marooned at one end — the card has a natural size and should keep it
       whether it has one neighbour or none. */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Link
          key={s.key}
          href={s.href}
          className="platform-activity-row group flex items-center gap-4 rounded-2xl p-4 md:p-5"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--mat-liquid-border)',
          }}
        >
          <Gauge
            value={s.total > 0 ? s.value / s.total : 0}
            label={`${s.value}`}
            caption={`من ${s.total}`}
            color={s.color}
            ariaLabel={s.ariaLabel}
            size={86}
          />
          <span className="min-w-0 flex-1">
            <span
              className="block font-outfit font-bold text-[14px]"
              style={{ color: 'var(--text-primary)' }}
            >
              {s.label}
            </span>
            <span
              className="mt-1 block text-[12px] leading-relaxed"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {s.caption}
            </span>
            <span
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              افتح
              <ArrowLeft className="h-3 w-3" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
