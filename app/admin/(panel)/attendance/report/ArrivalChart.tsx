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
            const height = max > 0 ? Math.max(b.count > 0 ? 3 : 0, (b.count / max) * 100) : 0;
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
                    height: `${height}%`,
                    minHeight: b.count > 0 ? 3 : 0,
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
