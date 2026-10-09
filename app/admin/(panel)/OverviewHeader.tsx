import { MapPin, Users } from 'lucide-react';

/**
 * The band at the top of the overview.
 *
 * This used to be a countdown: "يتبقى ١٤ يوماً على انطلاق المؤتمر", which was
 * the one piece of context that outranked every number on the page — while
 * there was a date to count to. The fourth edition is over, and a countdown
 * with nothing to count reads either as four zeros or as "انتهى المؤتمر"
 * printed above a panel somebody opens every day, which is noise.
 *
 * What the panel needs now is what state the platform is in: membership is
 * open, and this is how many accounts are in it. The count comes from the
 * page, which already queries it.
 */

// Latin digits with Arabic month names, matching /admin/insights: the stat
// tiles next to this render Latin numerals, and a panel that mixes digit
// systems is harder to read than one that commits to either.
const TODAY_FORMAT = new Intl.DateTimeFormat('ar-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function OverviewHeader({
  now = new Date(),
  memberCount,
}: {
  now?: Date;
  /** How many accounts exist, for the badge on the right. */
  memberCount?: number;
}) {
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
          <Users className="h-5 w-5" style={{ color: 'var(--accent-violet)' }} />
        </span>

        <div>
          <p className="font-outfit font-bold text-[15px] leading-tight" style={{ color: 'var(--text-primary)' }}>
            المنصة مفتوحة للعضوية
          </p>
          <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {typeof memberCount === 'number'
              ? `${memberCount.toLocaleString('en-US')} حساباً مسجَّلاً`
              : 'التسجيل متاح للجميع'}
          </p>
        </div>

        <span
          className="hidden sm:block h-9 w-px shrink-0"
          style={{ background: 'var(--mat-liquid-border)' }}
        />

        <div className="hidden sm:block">
          <p className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            مؤتمر الإبداع والابتكار
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
