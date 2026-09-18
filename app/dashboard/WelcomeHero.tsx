import Link from 'next/link';
import { CalendarClock, MapPin, ArrowLeft, QrCode } from 'lucide-react';
import { CONFERENCE_DAYS, daysUntilConference } from '@/lib/conference';

/**
 * The top of the attendee's dashboard: who they are, when the conference is,
 * and the code on their badge.
 *
 * The badge code is the one thing an attendee is asked for at the door, so it
 * is treated as the hero rather than as the first of three identical stat
 * cards — two of which read "0" on a brand-new account and made the whole page
 * open on a row of zeros.
 */

const DAY_ONLY = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });

function dateOf({ y, m, d }: { y: number; m: number; d: number }): Date {
  return new Date(y, m - 1, d);
}

function daysLabel(days: number): string {
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  if (days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}

export default function WelcomeHero({
  firstName,
  category,
  code,
  now = new Date(),
}: {
  firstName: string;
  category: string;
  code: string | null;
  now?: Date;
}) {
  const days = daysUntilConference(now);
  const start = dateOf(CONFERENCE_DAYS.dayOne);
  const end = dateOf(CONFERENCE_DAYS.dayTwo);
  const sameMonth = CONFERENCE_DAYS.dayOne.m === CONFERENCE_DAYS.dayTwo.m;
  const range = sameMonth
    ? `${DAY_ONLY.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`
    : `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`;

  // Never counts into negatives — the public site already spent a month
  // advertising a date that had passed, and this is the same mistake one
  // subtraction away.
  const countdown =
    days > 0
      ? `يتبقى ${daysLabel(days)}`
      : days === 0
        ? 'المؤتمر اليوم'
        : 'انتهى المؤتمر';

  return (
    <section
      className="rounded-2xl p-6 md:p-7"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--mat-liquid-border)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            مؤتمر الإبداع والابتكار · النسخة الرابعة {CONFERENCE_DAYS.dayTwo.y}
          </p>

          <h1
            className="mt-2 font-outfit font-bold text-2xl md:text-[26px]"
            style={{ color: 'var(--text-primary)' }}
          >
            أهلاً {firstName}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {category && (
              <span
                className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)',
                  color: 'var(--accent-violet)',
                }}
              >
                {category}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-[12.5px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              {countdown} · {range}
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[12.5px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <MapPin className="h-3.5 w-3.5" />
              إسطنبول، تركيا
            </span>
          </div>
        </div>

        {/* The pass. Shown even before a code exists, so the card explains the
            gap instead of silently rendering an em dash. */}
        <Link
          href="/dashboard/badge"
          className="platform-activity-row w-full sm:w-auto rounded-xl p-4"
          style={{
            background: 'var(--mat-liquid-bg)',
            // Tinted so the pass reads as the one object on this page the
            // attendee actually carries, not as another panel.
            border: '1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)',
          }}
        >
          <span className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            <QrCode className="h-3.5 w-3.5" />
            رمز بطاقتك
          </span>

          <span
            className="mt-2 block font-bold text-[19px] tracking-[0.12em]"
            style={{
              color: code ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontFamily: code ? 'monospace' : undefined,
            }}
            dir={code ? 'ltr' : undefined}
          >
            {code ?? 'قيد التأكيد'}
          </span>

          <span
            className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold"
            style={{ color: 'var(--accent-violet)' }}
          >
            {code ? 'اعرض بطاقتك' : 'تفاصيل التسجيل'}
            <ArrowLeft className="h-3 w-3" />
          </span>
        </Link>
      </div>
    </section>
  );
}
