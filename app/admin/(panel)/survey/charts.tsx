/**
 * The chart vocabulary of the results page.
 *
 * Three shapes, each for one job, and nothing that needs a library: these are
 * bars and a stack, and a charting dependency would ship a renderer to draw
 * rectangles the panel's own tokens already describe.
 *
 * Colour is spent in exactly one place — the five ordered steps of a rating,
 * which are a single hue running light to dark and are declared per theme in
 * globals.css because a ramp that reads on white has its pale end invisible on
 * a near-black card. Everywhere else a chart is one series, so identity is
 * carried by the row label and the bar is the panel's primary ink.
 */

export const RATE_STEPS = ['var(--rate-1)', 'var(--rate-2)', 'var(--rate-3)', 'var(--rate-4)', 'var(--rate-5)'];

/**
 * A ranking — which things scored highest, in order.
 *
 * The chart an organizer actually acts on: it answers "what was best and what
 * was worst" in one glance, which no table of averages does. Sorted by value,
 * because the ranking is the point; the scale's own order is the other chart.
 */
export function RankBars({
  rows,
  max,
}: {
  rows: { label: string; value: number | null; answered: number }[];
  max: number;
}) {
  const rated = rows.filter((r) => r.value !== null);
  if (rated.length === 0) {
    return <p className="py-6 text-center text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>لا توجد تقييمات بعد</p>;
  }

  const sorted = [...rated].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  // Only the top is emphasised. Drawing the worst at full strength too — which
  // is what this did first — gives the lowest score the same visual weight as
  // the highest, and "الضيافة 2.9" in solid ink reads at a glance as a result
  // to be pleased about. Being last in a sorted list is emphasis enough.
  const best = sorted[0].value;

  return (
    <div className="space-y-2">
      {sorted.map((r) => {
        const value = r.value!;
        // The bar starts at 1, not 0: on a 1–5 scale no answer can be below 1,
        // and a bar drawn from zero makes 3.9 and 4.4 look nearly identical.
        const share = ((value - 1) / (max - 1)) * 100;
        const isBest = sorted.length > 1 && value === best;

        return (
          <div key={r.label} className="flex items-center gap-3">
            <span
              className="shrink-0 truncate text-[12.5px]"
              style={{ color: 'var(--text-secondary)', width: 190 }}
              title={r.label}
            >
              {r.label}
            </span>

            <div className="relative h-6 flex-1 overflow-hidden rounded-md" style={{ background: 'var(--mat-liquid-bg)' }}>
              <div
                className="h-full rounded-md"
                style={{
                  width: `${Math.max(2, share)}%`,
                  background: 'var(--primary)',
                  opacity: isBest ? 1 : 0.5,
                }}
              />
            </div>

            <span
              className="shrink-0 tabular-nums text-[12.5px] font-semibold"
              style={{ color: 'var(--text-primary)', width: 76, textAlign: 'left' }}
              dir="ltr"
            >
              {value.toFixed(1)}
              <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}> · {r.answered}</span>
            </span>
          </div>
        );
      })}

      <p className="pt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        الشريط يبدأ من 1 لا من صفر — لا إجابة تقلّ عن 1 على هذا المقياس، والبدء من صفر
        يجعل 3.9 و4.4 متشابهين. الرقم الثاني عدد من أجاب.
      </p>
    </div>
  );
}

/**
 * How one question's answers spread across its scale.
 *
 * The chart that catches what an average hides: two questions can both average
 * 3.5, one because everybody shrugged and one because half the room loved it
 * and half hated it, and only this tells them apart.
 */
export function StackedScale({
  distribution,
  total,
}: {
  distribution: { value: number; count: number }[];
  total: number;
}) {
  if (total === 0) {
    return <div className="h-6 rounded-md" style={{ background: 'var(--mat-liquid-bg)' }} />;
  }

  return (
    <div className="flex h-6 overflow-hidden rounded-md" style={{ background: 'var(--mat-liquid-bg)' }}>
      {distribution.map((d, i) => {
        if (d.count === 0) return null;
        const share = (d.count / total) * 100;
        return (
          <div
            key={d.value}
            // A 2px surface gap between neighbouring segments, so two steps of
            // one hue do not read as a single longer block.
            style={{
              width: `${share}%`,
              background: RATE_STEPS[Math.min(i, RATE_STEPS.length - 1)],
              borderInlineEnd: i < distribution.length - 1 ? '2px solid var(--bg-elevated)' : undefined,
            }}
            title={`${d.value} — ${d.count} (${Math.round(share)}%)`}
          />
        );
      })}
    </div>
  );
}

/** The legend the stack needs, since five segments cannot be labelled inside it. */
export function ScaleLegend({ max }: { max: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          <span
            className="inline-block rounded-sm"
            style={{ width: 10, height: 10, background: RATE_STEPS[Math.min(i, RATE_STEPS.length - 1)] }}
          />
          {i + 1}
        </span>
      ))}
      <span className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
        — من الأضعف إلى الأقوى
      </span>
    </div>
  );
}

/**
 * Answers per day.
 *
 * Vertical, because time runs along an axis and a reader expects to scan it
 * sideways. Every day in the span gets a column, including the empty ones: a
 * chart that skips a silent day draws a steady trickle where there was a gap.
 */
/**
 * The bar area, in pixels.
 *
 * Pixels rather than a percentage, and this is the whole reason the function
 * below looks the way it does. A column in a row laid out with `items-end` is
 * sized by its contents, so its height is indefinite — and a child asking for
 * `height: 70%` of an indefinite height gets `auto`, which here means the
 * 3px minimum. Measured in a browser: a bar asking for 80% rendered at 3px.
 * Every column came out the same height, which is a chart that draws nothing.
 */
const CHART_HEIGHT = 132;
const LABEL_SPACE = 34;
const BAR_AREA = CHART_HEIGHT - LABEL_SPACE;

export function DailyBars({ days }: { days: { day: string; label: string; count: number }[] }) {
  if (days.length === 0) {
    return <p className="py-6 text-center text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>لا توجد إجابات بعد</p>;
  }

  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5" style={{ height: CHART_HEIGHT, minWidth: Math.max(220, days.length * 26) }}>
        {days.map((d) => (
          <div key={d.day} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
              {d.count > 0 ? d.count : ''}
            </span>
            <div
              className="w-full rounded-t"
              style={{
                height: d.count > 0 ? Math.max(3, Math.round((d.count / max) * BAR_AREA)) : 0,
                background: 'var(--primary)',
                opacity: d.count === max ? 1 : 0.55,
              }}
              title={`${d.label} — ${d.count}`}
            />
            <span className="h-3 text-[9.5px] tabular-nums" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
