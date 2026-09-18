import { EmptyNote } from '@/components/admin/Panel';
import type { TimeBucket } from './aggregate';

// The plot area in pixels. Heights are computed in px rather than as a
// percentage so the value sitting above a full-height column can never push the
// card taller than its frame.
const PLOT_HEIGHT = 120;
const MIN_BAR_HEIGHT = 2;

/**
 * Columns over time, one per bucket, each carrying its count as text.
 *
 * Every height divides by the tallest column, guarded: with a single signup —
 * or none — `max` is 0 or 1 and the columns fall back to the baseline stub
 * instead of dividing by zero.
 */
export default function TimeBars({ buckets }: { buckets: TimeBucket[] }) {
  if (buckets.length === 0) return <EmptyNote />;

  const max = buckets.reduce((highest, bucket) => Math.max(highest, bucket.count), 0);

  // Beyond ~12 columns the date labels would collide, so only every nth is
  // printed. The empty labels keep their box, so the columns stay evenly
  // spaced rather than shuffling under the printed ones.
  const labelEvery = Math.ceil(buckets.length / 12);

  return (
    <div className="overflow-x-auto">
      <ul
        className="flex items-end gap-1.5 pb-2"
        style={{ borderBottom: '1px solid var(--mat-liquid-border)' }}
      >
        {buckets.map((bucket) => {
          const height = max > 0 ? Math.max(MIN_BAR_HEIGHT, Math.round((bucket.count / max) * PLOT_HEIGHT)) : MIN_BAR_HEIGHT;
          const empty = bucket.count === 0;

          return (
            <li
              key={bucket.key}
              className="flex-1 flex flex-col items-center justify-end gap-1.5"
              // Plot area + room for the value above the tallest column, so a
              // full-height bar and its number both fit without overflowing.
              style={{ minWidth: 16, height: PLOT_HEIGHT + 26 }}
              title={`${bucket.label} — ${bucket.count}`}
            >
              <span
                className="shrink-0 text-[10.5px] font-semibold tabular-nums"
                style={{ color: empty ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
              >
                {bucket.count}
              </span>
              <span
                className="w-full shrink-0"
                style={{
                  maxWidth: 22,
                  height: empty ? MIN_BAR_HEIGHT : height,
                  background: empty ? 'var(--mat-liquid-border)' : 'var(--accent-blue)',
                  borderStartStartRadius: 4,
                  borderStartEndRadius: 4,
                }}
              />
            </li>
          );
        })}
      </ul>

      <ul className="flex items-start gap-1.5 pt-2">
        {buckets.map((bucket, index) => (
          <li
            key={bucket.key}
            className="flex-1 text-center text-[10px] leading-tight"
            style={{ minWidth: 16, color: 'var(--text-tertiary)' }}
          >
            {index % labelEvery === 0 || index === buckets.length - 1 ? bucket.label : ' '}
          </li>
        ))}
      </ul>
    </div>
  );
}
