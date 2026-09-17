import { EmptyNote } from './Panel';

export interface BarItem {
  label: string;
  count: number;
  color: string;
}

// A non-zero count always keeps a visible sliver, so "one registration" never
// renders as the same nothing as "no registrations".
const MIN_VISIBLE_PERCENT = 2;

/**
 * Horizontal bars: label · proportional fill · count.
 *
 * `basis` is what 100% of the track means — the total when the bars are shares
 * of one whole (categories), the leader's count when they are a ranking (top
 * countries), where a share-of-total bar would be a hairline for everyone.
 * It is guarded, so a basis of 0 (nothing registered yet) yields 0% rather
 * than NaN.
 */
export default function BarList({ items, basis }: { items: BarItem[]; basis: number }) {
  if (items.length === 0) return <EmptyNote />;

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const share = basis > 0 ? (item.count / basis) * 100 : 0;
        const width = item.count > 0 ? Math.max(MIN_VISIBLE_PERCENT, Math.min(100, share)) : 0;

        return (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className="w-24 sm:w-32 shrink-0 truncate text-[12.5px]"
              style={{ color: 'var(--text-secondary)' }}
              title={item.label}
            >
              {item.label}
            </span>

            {/* Track. Rounded + clipped so the fill's baseline end follows it. */}
            <span
              className="flex-1 min-w-0 rounded-full overflow-hidden"
              style={{ height: 8, background: 'var(--mat-liquid-bg)' }}
            >
              <span
                className="block h-full"
                style={{
                  width: `${width}%`,
                  background: item.color,
                  borderStartEndRadius: 4,
                  borderEndEndRadius: 4,
                }}
              />
            </span>

            {/* text-start is the box's right edge under RTL: the digits line up
                on their units and stay beside the bar's tip. */}
            <span
              className="w-9 shrink-0 text-start text-[12.5px] font-semibold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.count.toLocaleString('en-US')}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
