import { CalendarClock, MapPin } from 'lucide-react';
import { CONFERENCE_DAYS, daysUntilConference } from '@/lib/conference';

/**
 * The band at the top of the overview.
 *
 * A conference panel has one piece of context that outranks every number on
 * the page: how long is left. It used to say nothing at all — just the words
 * "نظرة عامة" — while the site itself spent a month advertising a date that
 * had already passed. Putting the count here means anyone who opens the panel
 * sees it.
 */

// Latin digits with Arabic month names, matching /admin/insights: the stat
// tiles next to this render Latin numerals, and a panel that mixes digit
// systems is harder to read than one that commits to either.
const DAY_ONLY = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });
const TODAY_FORMAT = new Intl.DateTimeFormat('ar-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function dateOf({ y, m, d }: { y: number; m: number; d: number }): Date {
  return new Date(y, m - 1, d);
}

/** "١٤ يوماً" — Arabic counts a day, two days and many days differently. */
function daysLabel(days: number): string {
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}

export default function OverviewHeader({ now = new Date() }: { now?: Date }) {
  const days = daysUntilConference(now);
  const start = dateOf(CONFERENCE_DAYS.dayOne);
  const end = dateOf(CONFERENCE_DAYS.dayTwo);
  // Both days almost always share a month, and "2 أكتوبر – 3 أكتوبر" says it
  // twice; only spell the month out on each side when they actually differ.
  const sameMonth = CONFERENCE_DAYS.dayOne.m === CONFERENCE_DAYS.dayTwo.m;
  const range = sameMonth
    ? `${DAY_ONLY.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`
    : `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`;

  // Three states, because a countdown that keeps counting into negatives is
  // how the site ended up advertising a date in the past.
  const status =
    days > 0
      ? { tone: 'soon' as const, headline: `يتبقى ${daysLabel(days)}`, sub: 'على انطلاق المؤتمر' }
      : days === 0
        ? { tone: 'live' as const, headline: 'المؤتمر اليوم', sub: 'انطلقت الفعاليات' }
        : { tone: 'past' as const, headline: 'انتهى المؤتمر', sub: range };

  const accent = status.tone === 'past' ? 'var(--text-tertiary)' : 'var(--accent-violet)';

  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="font-outfit font-bold text-[22px]" style={{ color: 'var(--text-primary)' }}>
          نظرة عامة
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {TODAY_FORMAT.format(now)}
        </p>
      </div>

      <div
        className="flex items-center gap-4 rounded-2xl px-5 py-3.5"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--mat-liquid-border)',
        }}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--accent-violet) 14%, transparent)' }}
        >
          <CalendarClock className="h-5 w-5" style={{ color: accent }} />
        </span>

        <div>
          <p className="font-outfit font-bold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>
            {status.headline}
          </p>
          <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {status.sub}
          </p>
        </div>

        <span
          className="hidden sm:block h-9 w-px shrink-0"
          style={{ background: 'var(--mat-liquid-border)' }}
        />

        <div className="hidden sm:block">
          <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {range}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            <MapPin className="h-3 w-3" />
            إسطنبول، تركيا
          </p>
        </div>
      </div>
    </header>
  );
}
