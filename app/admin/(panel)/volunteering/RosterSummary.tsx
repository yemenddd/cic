import { TriangleAlert, UserCheck, CalendarRange, CircleAlert } from 'lucide-react';
import type { RosterHealth } from '@/lib/volunteering';
import { arabicCount, arabicCountBare, VOLUNTEER, SHIFT } from '@/lib/arabic-plural';

/**
 * What the rota is short of, above the list.
 *
 * A table of shifts answers "what have we scheduled". It does not answer the
 * question an organizer opens this page with the week before the conference:
 * are we short of people, and where. The shortfall is counted in people rather
 * than in shifts, because "four shifts unfilled" and "four people short" are
 * different problems and only the second can be acted on.
 */

function Figure({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof UserCheck;
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

export default function RosterSummary({
  health,
  volunteerCount,
  unassignedVolunteers,
}: {
  health: RosterHealth;
  /** Accounts in the volunteer category, whether or not they took a shift. */
  volunteerCount: number;
  /** Of those, how many have not taken one. */
  unassignedVolunteers: number;
}) {
  const { stillNeeded, empty, filled, places, totalShifts } = health;

  // Nothing scheduled yet. A row of zeros says less than the empty state.
  if (totalShifts === 0) return null;

  const coverage = places > 0 ? Math.round((filled / places) * 100) : 100;

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure
          icon={CalendarRange}
          value={totalShifts}
          label="فترة في الجدول"
          color="var(--accent-blue)"
        />
        <Figure
          icon={UserCheck}
          value={`${coverage}٪`}
          // A fixed noun phrase with the numbers after it: an adjective placed
          // after the count would have to agree with it (مقاعد مشغولة but
          // مقعداً مشغولاً), and this reads correctly for every value.
          label={`المقاعد المشغولة ${filled} من ${places}`}
          color={coverage >= 100 ? 'var(--accent-cyan)' : 'var(--accent-violet)'}
        />
        <Figure
          icon={TriangleAlert}
          value={stillNeeded}
          label="النقص في المتطوعين"
          color={stillNeeded > 0 ? 'var(--destructive)' : 'var(--accent-cyan)'}
        />
        <Figure
          icon={CircleAlert}
          value={unassignedVolunteers}
          label={`من ${arabicCountBare(volunteerCount, VOLUNTEER)} بلا فترة`}
          color="var(--text-tertiary)"
        />
      </div>

      {/* Only when there is something to say — a banner that is always there
          stops being read within a day. */}
      {empty > 0 && (
        <p
          className="mt-3 flex items-start gap-2.5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--destructive)' }} />
          <span>
            {arabicCount(empty, SHIFT)} بلا أحد على الإطلاق.
            {stillNeeded > 0 && ` والمطلوب عبر الجدول كله ${arabicCountBare(stillNeeded, VOLUNTEER)}.`}
          </span>
        </p>
      )}
    </div>
  );
}
