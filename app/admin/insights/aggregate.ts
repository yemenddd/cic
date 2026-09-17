// Pure shaping helpers for /admin/insights.
//
// Kept out of the page so the bucketing rules are readable on their own: the
// page is responsible for querying, these functions are responsible for the
// shape the bars are drawn from.

export interface Slice {
  label: string;
  count: number;
}

/**
 * Turn a Prisma `groupBy` result for a free-text column (country, organization,
 * track) into the leading `limit` values.
 *
 * Blank and null groups are dropped rather than shown as an empty bar — "not
 * stated" is not a country, and rendering it as one would inflate the leader
 * board with a row nobody can act on. Values that differ only by surrounding
 * whitespace are merged, since they came from a free-text form field.
 */
export function topValues(rows: { value: string | null; count: number }[], limit: number): Slice[] {
  const merged = new Map<string, number>();

  for (const row of rows) {
    const label = row.value?.trim();
    if (!label) continue;
    merged.set(label, (merged.get(label) ?? 0) + row.count);
  }

  return Array.from(merged, ([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ar'))
    .slice(0, limit);
}

export type Granularity = 'day' | 'week' | 'month';

export interface TimeBucket {
  key: string;
  label: string;
  count: number;
}

export interface TimeSeries {
  granularity: Granularity;
  buckets: TimeBucket[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole days between two local midnights. Rounded because a DST boundary makes
// one of those days 23 or 25 hours long.
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

// Latin digits with Arabic month names: the counts beside them are Latin too,
// and a chart that mixes digit systems is harder to scan than either alone.
const DAY_LABEL = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'short' });
const MONTH_LABEL = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'short', year: 'numeric' });

/**
 * One bar per day while the range is short enough to read, per week beyond a
 * month, per month beyond half a year — the bar count stays in the range a
 * reader can take in instead of collapsing into a comb.
 */
export function pickGranularity(spanDays: number): Granularity {
  if (spanDays <= 31) return 'day';
  if (spanDays <= 182) return 'week';
  return 'month';
}

/**
 * Bucket timestamps into a gap-free series from the first to the last one.
 *
 * Empty stretches keep their bucket with a count of 0 — dropping them would
 * squeeze a quiet fortnight into the same width as a busy day and misstate the
 * shape of the signups. With no timestamps at all the series is empty, and the
 * caller renders the empty state rather than an axis with nothing on it.
 */
export function bucketByTime(dates: Date[]): TimeSeries {
  if (dates.length === 0) return { granularity: 'day', buckets: [] };

  const days = dates.map(startOfDay).sort((a, b) => a.getTime() - b.getTime());
  const first = days[0];
  const last = days[days.length - 1];
  const granularity = pickGranularity(daysBetween(first, last) + 1);

  // Week buckets are 7-day windows anchored at the first signup rather than on
  // a calendar weekday, so the series never opens with a part-week stub whose
  // low bar is an artefact of which day the conference opened registration.
  const indexOf = (day: Date): number => {
    if (granularity === 'day') return daysBetween(first, day);
    if (granularity === 'week') return Math.floor(daysBetween(first, day) / 7);
    return (day.getFullYear() - first.getFullYear()) * 12 + (day.getMonth() - first.getMonth());
  };

  const startOf = (index: number): Date => {
    if (granularity === 'day') return new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
    if (granularity === 'week') return new Date(first.getFullYear(), first.getMonth(), first.getDate() + index * 7);
    return new Date(first.getFullYear(), first.getMonth() + index, 1);
  };

  const counts = new Array<number>(indexOf(last) + 1).fill(0);
  for (const day of days) counts[indexOf(day)] += 1;

  return {
    granularity,
    buckets: counts.map((count, index) => {
      const start = startOf(index);
      return {
        key: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
        label: granularity === 'month' ? MONTH_LABEL.format(start) : DAY_LABEL.format(start),
        count,
      };
    }),
  };
}
