import type { LucideIcon } from 'lucide-react';

/**
 * One headline number.
 *
 * `accent` is optional on purpose: four tiles in four hues would spend the
 * colour channel on decoration, so the row stays in text tokens and only the
 * number that asks the organisers to *do* something carries a colour.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
}: {
  label: string;
  /**
   * A count, or something already shaped — "4.3 / 5", "+42".
   *
   * A number is grouped for reading; a string is printed as given, because the
   * figures that are not counts (an average with its scale, a signed index)
   * carry their own formatting and grouping them again would corrupt it.
   */
  value: number | string;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: accent ?? 'var(--text-tertiary)' }} />
        <p className="text-[12.5px] truncate" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
      </div>

      {/* Proportional figures, not tabular — nothing below this lines up with it. */}
      <p
        className="mt-3 font-outfit font-bold text-[28px] leading-none"
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </p>

      {hint && (
        <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
