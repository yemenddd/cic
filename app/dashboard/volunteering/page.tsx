import type { Metadata } from 'next';
import { CalendarClock, MapPin, Users, Clock, HandHeart, Info } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { CONFERENCE_DAYS } from '@/lib/conference';
import { arabicCountBare, SHIFT, VOLUNTEER } from '@/lib/arabic-plural';
import {
  byStartTime, canClaim, totalHours, REFUSAL_MESSAGES,
  type ShiftLike, type ClaimReason,
} from '@/lib/volunteering';
import { committeeLabel } from '@/lib/committees';
import CommitteePicker from './CommitteePicker';
import { MAX_SHIFTS_PER_VOLUNTEER } from '@/lib/categories';
import ShiftButton, { MineChip } from './ShiftButton';
import { volunteerAccess, NotEntitled } from './access';

export const metadata: Metadata = {
  title: 'تطوّعي | CIC',
  robots: { index: false, follow: false },
};

// The rota changes as other volunteers claim places, and a cached page would
// show somebody a slot that filled up an hour ago.
export const dynamic = 'force-dynamic';

const DATE_LABEL = new Intl.DateTimeFormat('ar-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const DAYS = [
  { key: 'dayOne' as const, date: CONFERENCE_DAYS.dayOne },
  { key: 'dayTwo' as const, date: CONFERENCE_DAYS.dayTwo },
];

function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Clock;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <span
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: 'var(--mat-liquid-bg)' }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </span>
      <span
        className="block font-outfit text-[20px] font-bold leading-none tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
      <span className="mt-1.5 block text-[11.5px] leading-snug" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
    </div>
  );
}

/** How full a shift is, as a bar rather than as a fraction to be read. */
function Capacity({ taken, capacity }: { taken: number; capacity: number }) {
  const full = taken >= capacity;
  const ratio = capacity > 0 ? Math.min(1, taken / capacity) : 1;

  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-1.5 w-16 overflow-hidden rounded-full"
        style={{ background: 'var(--mat-liquid-bg)' }}
      >
        <span
          className="block h-full rounded-full"
          style={{
            width: `${ratio * 100}%`,
            background: full ? 'var(--accent-cyan)' : 'var(--primary)',
          }}
        />
      </span>
      <span className="text-[11.5px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
        {/* "ينقص" rather than "… مطلوب": the adjective would have to agree
            with the count in number as well as gender (مطلوبان / مطلوبون),
            and a verb-first phrase sidesteps the agreement altogether. */}
        {full ? 'اكتمل الفريق' : `ينقص ${arabicCountBare(capacity - taken, VOLUNTEER)}`}
      </span>
    </span>
  );
}

export default async function VolunteeringPage() {
  const access = await volunteerAccess();
  if (access.userId === null) return <NotEntitled category={access.category} />;
  const { userId, committee } = access;

  // Queried directly rather than through safe() in lib/db/queries.ts: that
  // helper turns a database error into an empty array, which here would tell a
  // volunteer their rota is empty during an outage — and they would come to
  // the venue believing they were not needed.
  const [shifts, mineRows] = await Promise.all([
    prisma.volunteerShift.findMany({
      orderBy: [{ day: 'asc' }, { order: 'asc' }],
      include: { _count: { select: { assignments: true } } },
    }),
    prisma.volunteerAssignment.findMany({
      where: { userId },
      select: {
        shift: {
          select: { id: true, titleAr: true, day: true, startTime: true, endTime: true },
        },
      },
    }),
  ]);

  const mine = mineRows.map((r) => r.shift);
  const mineIds = new Set(mine.map((s) => s.id));
  const { hours, countedShifts } = totalHours(mine);

  const asShift = (s: (typeof shifts)[number]): ShiftLike => ({
    id: s.id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    isOpen: s.isOpen,
    taken: s._count.assignments,
    committee: s.committee,
  });

  // Decided here, with the same function the server action uses, so the button
  // and the write can never disagree about why something is unavailable.
  const SHORT_REFUSAL: Record<Exclude<ClaimReason, 'already'>, string> = {
    closed: 'مغلقة',
    full: 'مكتملة',
    clash: 'تتعارض',
    committee: 'لجنة أخرى',
    nocommittee: 'اختر لجنتك',
  };

  const refusalFor = (
    s: (typeof shifts)[number],
  ): { label: string; title: string } | null => {
    const verdict = canClaim(asShift(s), mine, committee);
    // 'already' is not a refusal to show — it is the release button.
    if (verdict.ok || verdict.reason === 'already') return null;
    return {
      label: SHORT_REFUSAL[verdict.reason],
      // The chip has room for one word; the reason it stands for is put where
      // anyone who stops on it can read it.
      title: verdict.reason === 'clash' && verdict.clashesWith
        ? `${REFUSAL_MESSAGES.clash}: «${verdict.clashesWith}»`
        : REFUSAL_MESSAGES[verdict.reason],
    };
  };

  const atLimit = mine.length >= MAX_SHIFTS_PER_VOLUNTEER;

  // The volunteer's own committee first and in full; the rest below, to look
  // at rather than to sign up for. Showing them is deliberate — a rota that
  // silently hides five sixths of the work leaves a volunteer with no idea
  // that there is anywhere to move to.
  const ours = shifts.filter((s) => s.committee === committee);
  const theirs = shifts.filter((s) => s.committee !== committee);

  const days = DAYS.map(({ key, date }) => ({
    key,
    label: DATE_LABEL.format(new Date(date.y, date.m - 1, date.d)),
    shifts: byStartTime(ours.filter((s) => s.day === key)),
    mineCount: mine.filter((s) => s.day === key).length,
  }));

  // Shifts an organizer gave a day outside the two — kept visible rather than
  // silently dropped, because a slot nobody can see is a slot nobody works.
  const knownDays = new Set(DAYS.map((d) => d.key as string));
  const otherShifts = byStartTime(ours.filter((s) => !knownDays.has(s.day)));

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          تطوّعي
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          فترات العمل التي تحتاجها لجنتك. اختر ما يناسبك — ويمكنك الإلغاء ما دامت
          الفترة مفتوحة.
        </p>
        {committee && (
          <div className="mt-3">
            <CommitteePicker current={committee} compact />
          </div>
        )}
      </div>

      {/* Nothing else on this page means anything until they have a committee,
          so it is asked first and alone rather than as a field among others. */}
      {!committee && (
        <div className="mb-6">
          <CommitteePicker current={null} />
        </div>
      )}

      {committee && ours.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={CalendarClock}
            value={mine.length}
            label="فترة في جدولي"
            color="var(--primary)"
          />
          <Stat
            icon={Clock}
            // Said as a number of hours rather than as a bare figure: this is
            // what the volunteering certificate will state.
            value={countedShifts > 0 ? `${hours}` : '—'}
            label="ساعة تطوّع تقريباً"
            color="var(--accent-violet)"
          />
          <Stat
            icon={Users}
            value={ours.filter((s) => s.isOpen && s._count.assignments < s.capacity).length}
            label="فترة في لجنتك تحتاج متطوعين"
            color="var(--accent-cyan)"
          />
          <Stat
            icon={HandHeart}
            value={`${MAX_SHIFTS_PER_VOLUNTEER - mine.length}`}
            label="فترة يمكنك حجزها بعد"
            color="var(--text-tertiary)"
          />
        </div>
      )}

      {atLimit && (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-secondary)',
          }}
        >
          <Info className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
          بلغتَ الحد الأقصى ({arabicCountBare(MAX_SHIFTS_PER_VOLUNTEER, SHIFT)}). ألغِ فترة
          لتتمكن من حجز غيرها.
        </p>
      )}

      {committee && ours.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <HandHeart className="mx-auto h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {shifts.length === 0
              ? 'لم يُنشر جدول التطوّع بعد'
              : `لا توجد فترات في ${committeeLabel(committee)} بعد`}
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            سيصلك إشعار حين يفتح فريق التنظيم فترات العمل.
          </p>
        </div>
      ) : (
        [...days, { key: 'other', label: 'فترات أخرى', shifts: otherShifts, mineCount: 0 }]
          .filter((d) => d.shifts.length > 0)
          .map((day) => (
            <section key={day.key} className="mb-7">
              <h2
                className="mb-3 flex items-center gap-2 font-outfit text-[13.5px] font-bold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {day.label}
                {day.mineCount > 0 && (
                  <span className="text-[11.5px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    ({arabicCountBare(day.mineCount, SHIFT)} لك)
                  </span>
                )}
                <span className="h-px flex-1" style={{ background: 'var(--mat-liquid-border)' }} aria-hidden />
              </h2>

              <ul>
                {day.shifts.map((s, i) => {
                  const isMine = mineIds.has(s.id);
                  const refusal = refusalFor(s);

                  return (
                    <li key={s.id} className="flex gap-3 sm:gap-4">
                      <div className="relative flex w-16 shrink-0 flex-col items-center pt-4">
                        <span
                          className="text-[12px] font-semibold tabular-nums"
                          dir="ltr"
                          style={{ color: isMine ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                        >
                          {s.startTime}
                        </span>
                        <span className="text-[10.5px] tabular-nums" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>
                          {s.endTime}
                        </span>
                        <span
                          aria-hidden
                          className="mt-2 h-2 w-2 shrink-0 rounded-full"
                          style={{ background: isMine ? 'var(--accent-cyan)' : 'var(--border-strong)' }}
                        />
                        {i < day.shifts.length - 1 && (
                          <span aria-hidden className="mt-1 w-px flex-1" style={{ background: 'var(--border-default)' }} />
                        )}
                      </div>

                      <div
                        className="mb-3 min-w-0 flex-1 rounded-2xl p-4"
                        style={{
                          background: isMine ? 'var(--surface-highlight)' : 'var(--bg-elevated)',
                          border: '1px solid var(--mat-liquid-border)',
                          borderInlineStartWidth: isMine ? '3px' : '1px',
                          borderInlineStartColor: isMine ? 'var(--accent-cyan)' : 'var(--mat-liquid-border)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[14.5px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                                {s.titleAr}
                              </h3>
                              {isMine && <MineChip />}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className="inline-block rounded-lg px-2 py-0.5 text-[11.5px]"
                                style={{
                                  background: 'var(--mat-liquid-bg)',
                                  border: '1px solid var(--mat-liquid-border)',
                                  color: 'var(--text-tertiary)',
                                }}
                              >
                                {committeeLabel(s.committee)}
                              </span>
                              {s.location && (
                                <span
                                  className="inline-flex items-center gap-1 text-[11.5px]"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                  {s.location}
                                </span>
                              )}
                            </div>

                            {s.notesAr && (
                              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {s.notesAr}
                              </p>
                            )}

                            <div className="mt-2.5">
                              <Capacity taken={s._count.assignments} capacity={s.capacity} />
                            </div>
                          </div>

                          <ShiftButton
                            shiftId={s.id}
                            mine={isMine}
                            disabled={Boolean(refusal) || (!isMine && atLimit)}
                            disabledLabel={refusal?.label ?? 'بلغت الحد'}
                            disabledTitle={
                              refusal?.title
                              ?? `بلغتَ الحد الأقصى (${MAX_SHIFTS_PER_VOLUNTEER}) — ألغِ فترة لحجز غيرها`
                            }
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}

      {/* The other committees' work, to read rather than to take.
      
          Shown because a rota that hides five sixths of what is happening
          leaves a volunteer with no idea that another committee is short —
          and no reason to ask to move. No buttons: the committee is what
          decides, and a button that always refuses is worse than none. */}
      {committee && theirs.length > 0 && (
        <section className="mt-9">
          <h2
            className="mb-1.5 flex items-center gap-2 font-outfit text-[13.5px] font-bold"
            style={{ color: 'var(--text-secondary)' }}
          >
            فترات اللجان الأخرى
            <span className="h-px flex-1" style={{ background: 'var(--mat-liquid-border)' }} aria-hidden />
          </h2>
          <p className="mb-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            للاطلاع فقط — الحجز في لجنتك. إن أردت الانتقال، غيّر لجنتك من أعلى الصفحة.
          </p>

          <ul className="space-y-2">
            {byStartTime(theirs).map((s) => {
              const short = Math.max(0, s.capacity - s._count.assignments);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl px-3.5 py-2.5"
                  style={{
                    background: 'var(--mat-liquid-bg)',
                    border: '1px solid var(--mat-liquid-border)',
                  }}
                >
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {s.titleAr}
                  </span>
                  <span
                    className="rounded-lg px-2 py-0.5 text-[11px]"
                    style={{ border: '1px solid var(--mat-liquid-border)', color: 'var(--text-tertiary)' }}
                  >
                    {committeeLabel(s.committee)}
                  </span>
                  <span className="text-[11.5px] tabular-nums" dir="ltr" style={{ color: 'var(--text-tertiary)' }}>
                    {s.startTime} — {s.endTime}
                  </span>
                  <span
                    className="ms-auto text-[11.5px]"
                    style={{ color: short > 0 ? 'var(--text-tertiary)' : 'var(--accent-cyan)' }}
                  >
                    {short > 0 ? `ينقصها ${arabicCountBare(short, VOLUNTEER)}` : 'مكتملة'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
