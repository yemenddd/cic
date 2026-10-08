import type { ArrivalCurve } from '@/lib/attendance-analytics';

/**
 * The arrival curve, as columns against a time axis.
 *
 * A table of half-hour counts is the same data and nobody reads the shape out
 * of it — and the shape is the whole point: whether arrivals came as one wall
 * before the opening or spread across the morning is what decides how many
 * people stand at the door and for how long.
 *
 * The peak column is coloured differently and labelled, because it is the one
 * number anybody writes down.
 */
export default function ArrivalChart({
  curve,
  caption,
}: {
  curve: ArrivalCurve;
  caption?: string;
}) {
  if (curve.buckets.length === 0) {
    return (
      <p className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        لم يُسجَّل حضور في هذا اليوم.
      </p>
    );
  }

  const max = curve.peak?.count ?? 1;

  /**
   * The bar area, in pixels.
   *
   * This used to be a percentage, and it never worked: a column in a row laid
   * out with `items-end` is sized by its contents, so its height is
   * indefinite, and a child asking for a percentage of an indefinite height
   * gets `auto` — which here meant the 3px minimum. Measured in a browser: a
   * bar asking for 80% rendered at 3px. Every hour of the conference has been
   * drawn at the same height since this was written, with the correct number
   * printed above it, which is exactly the kind of wrong a chart gets away
   * with for a long time.
   */
  const BAR_AREA = 150 - 34;
  // Every hour gets a label; the half-hours between stay bare, or the axis is
  // unreadable at any width a phone has.
  const showLabel = (minutes: number) => minutes % 60 === 0;

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="flex items-end gap-1"
          style={{ height: 150, minWidth: Math.max(240, curve.buckets.length * 22) }}
        >
          {curve.buckets.map((b) => {
            const isPeak = b.startMinutes === curve.peak?.startMinutes;
            const height = b.count > 0 ? Math.max(3, Math.round((b.count / max) * BAR_AREA)) : 0;
            return (
              <div key={b.startMinutes} className="flex min-w-[14px] flex-1 flex-col items-center gap-1">
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: isPeak ? 'var(--accent-cyan)' : 'var(--text-tertiary)' }}
                >
                  {b.count > 0 ? b.count : ''}
                </span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height,
                    background: isPeak ? 'var(--accent-cyan)' : 'var(--primary)',
                    opacity: isPeak ? 1 : 0.55,
                  }}
                  title={`${b.label} — ${b.count}`}
                />
                <span
                  className="h-3 text-[9.5px] tabular-nums"
                  dir="ltr"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showLabel(b.startMinutes) ? b.label : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {caption && (
        <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {caption}
        </p>
      )}
    </div>
  );
}
