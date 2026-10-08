/**
 * One question's answers as bars.
 *
 * A single series — how many people chose each point — so there is no legend
 * and no palette: identity is carried by the row label, and a second colour
 * would encode the rating twice, once by position and once by hue. The bars
 * are drawn with the panel's own primary rather than a chart palette, because
 * a results page that invents its own colours stops looking like the platform.
 *
 * Every value is labelled directly, which a chart of five to eleven rows can
 * afford and which removes the need for an axis nobody reads precisely. The
 * mode is marked, since "which answer won" is the first thing anybody looks
 * for and is otherwise a comparison of bar lengths by eye.
 */
export interface Bar {
  label: string;
  count: number;
  /** Shown instead of the label at the start of the row, for a numeric scale. */
  numeric?: boolean;
}

export default function ResultBars({
  bars,
  total,
  emptyNote = 'لا توجد إجابات بعد',
}: {
  bars: Bar[];
  /** The denominator for the percentages — answers to this question. */
  total: number;
  emptyNote?: string;
}) {
  if (total === 0) {
    return (
      <p className="py-5 text-center text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
        {emptyNote}
      </p>
    );
  }

  const max = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="space-y-1.5">
      {bars.map((b) => {
        const share = total > 0 ? Math.round((b.count / total) * 100) : 0;
        const isMode = b.count === max && b.count > 0;

        return (
          <div key={b.label} className="flex items-center gap-2.5">
            <span
              className={`shrink-0 text-[12px] ${b.numeric ? 'tabular-nums text-center' : 'truncate'}`}
              style={{ color: 'var(--text-secondary)', width: b.numeric ? 24 : 136 }}
              title={b.numeric ? undefined : b.label}
            >
              {b.label}
            </span>

            {/* The track is the full width, so a short bar reads as a small
                share of something rather than as a small thing. */}
            <div
              className="relative h-5 flex-1 overflow-hidden rounded-md"
              style={{ background: 'var(--mat-liquid-bg)' }}
            >
              <div
                className="h-full rounded-md"
                style={{
                  width: `${(b.count / max) * 100}%`,
                  minWidth: b.count > 0 ? 4 : 0,
                  background: 'var(--primary)',
                  opacity: isMode ? 1 : 0.5,
                }}
              />
            </div>

            <span
              className="shrink-0 tabular-nums text-[12px]"
              style={{ color: 'var(--text-secondary)', width: 68, textAlign: 'left' }}
              dir="ltr"
            >
              {b.count} · {share}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
