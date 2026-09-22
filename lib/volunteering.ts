/**
 * Volunteer shifts — the rules, with no database and no React.
 *
 * The volunteer tier advertises a hand in running the conference and gave a
 * dashboard with one section removed. This is the reckoning behind the thing
 * that makes it real: whether a slot still needs people, whether the one
 * somebody just claimed collides with a slot they already have, and what the
 * organizers are short of.
 *
 * Pure, so the same answers serve the volunteer's page, the organizers' roster
 * and the checks.
 */

export interface ShiftTime {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ShiftLike extends ShiftTime {
  id: string;
  capacity: number;
  isOpen: boolean;
  /** How many volunteers have claimed it. */
  taken: number;
  /** Which committee's work this is — see lib/committees.ts. */
  committee: string;
}

/**
 * "09:00" as minutes from midnight, or null when it is not a time.
 *
 * Times are stored as the text the organizer typed, so this has to cope with
 * what a person types: "9:00", "09:00", and a stray space. Anything it cannot
 * read is treated as unknown rather than guessed at — a shift whose hours
 * nobody can parse must not silently stop clashing with everything.
 */
export function minutesOfDay(raw: string | null | undefined): number | null {
  const m = /^\s*(\d{1,2})\s*:\s*(\d{2})\s*$/.exec(raw ?? '');
  if (!m) return null;

  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Do two shifts overlap?
 *
 * Touching ends do not: a shift ending at 12:00 and one starting at 12:00 are
 * back to back, which is a long day and not a clash.
 *
 * Different days never overlap. Unparseable hours return false — the shift is
 * still shown, and an organizer reading the roster can see it; inventing a
 * clash from a value nobody can read would block a real signup over a typo.
 */
export function shiftsOverlap(a: ShiftTime, b: ShiftTime): boolean {
  if (a.day !== b.day) return false;

  const aStart = minutesOfDay(a.startTime);
  const aEnd = minutesOfDay(a.endTime);
  const bStart = minutesOfDay(b.startTime);
  const bEnd = minutesOfDay(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;

  return aStart < bEnd && bStart < aEnd;
}

export type ClaimReason = 'closed' | 'full' | 'already' | 'clash' | 'committee' | 'nocommittee';

export type ClaimRefusal =
  | { ok: true }
  | { ok: false; reason: ClaimReason; clashesWith?: string };

/**
 * May this volunteer take this shift?
 *
 * Every answer the page can give, decided in one place, so the button and the
 * server action cannot disagree about why something was refused.
 *
 * The committee is checked before anything about the shift itself: telling
 * somebody a slot is full when the real answer is that it belongs to another
 * committee would send them back to look at it every hour.
 */
export function canClaim(
  shift: ShiftLike,
  held: Array<ShiftTime & { id: string; titleAr: string }>,
  volunteerCommittee: string | null,
): ClaimRefusal {
  if (held.some((h) => h.id === shift.id)) return { ok: false, reason: 'already' };

  if (!volunteerCommittee) return { ok: false, reason: 'nocommittee' };
  if (shift.committee !== volunteerCommittee) return { ok: false, reason: 'committee' };

  if (!shift.isOpen) return { ok: false, reason: 'closed' };
  if (shift.taken >= shift.capacity) return { ok: false, reason: 'full' };

  const clash = held.find((h) => shiftsOverlap(h, shift));
  if (clash) return { ok: false, reason: 'clash', clashesWith: clash.titleAr };

  return { ok: true };
}

export const REFUSAL_MESSAGES: Record<ClaimReason, string> = {
  closed: 'هذه الفترة مغلقة — تواصل مع فريق التنظيم',
  full: 'اكتمل عدد المتطوعين في هذه الفترة',
  already: 'أنت مسجّل في هذه الفترة بالفعل',
  clash: 'تتعارض مع فترة أخرى في جدولك',
  committee: 'هذه الفترة تخصّ لجنة أخرى',
  nocommittee: 'اختر لجنتك أولاً لتتمكن من الحجز',
};

export interface RosterHealth {
  /** Slots still needing people, counted as people not as shifts. */
  stillNeeded: number;
  /** Shifts with nobody on them at all. */
  empty: number;
  /** Shifts that have everybody they need. */
  full: number;
  totalShifts: number;
  /** Every place filled across every open shift. */
  filled: number;
  /** Every place that exists across every open shift. */
  places: number;
}

/**
 * What the organizers are short of.
 *
 * Counted in people rather than in shifts, because "four shifts unfilled" and
 * "four people short" are very different problems and only the second one is
 * actionable at eight in the morning.
 *
 * Closed shifts are left out of the shortfall entirely: a settled roster is
 * not a gap, and counting it as one would leave the panel permanently in the
 * red over work that is already arranged.
 */
export function rosterHealth(shifts: ShiftLike[]): RosterHealth {
  let stillNeeded = 0;
  let empty = 0;
  let full = 0;
  let filled = 0;
  let places = 0;

  for (const s of shifts) {
    if (s.taken === 0) empty++;
    if (s.taken >= s.capacity) full++;
    if (!s.isOpen) continue;

    places += s.capacity;
    filled += Math.min(s.taken, s.capacity);
    stillNeeded += Math.max(0, s.capacity - s.taken);
  }

  return { stillNeeded, empty, full, totalShifts: shifts.length, filled, places };
}

/**
 * How long a shift runs, in minutes, or null when its hours cannot be read.
 *
 * A shift that ends before it starts returns null rather than a negative
 * number: it is a typo, and the honest answer to "how long is it" is that
 * nobody knows.
 */
export function durationMinutes(shift: ShiftTime): number | null {
  const start = minutesOfDay(shift.startTime);
  const end = minutesOfDay(shift.endTime);
  if (start === null || end === null || end <= start) return null;
  return end - start;
}

/**
 * The hours a volunteer has committed to, rounded to one decimal.
 *
 * This is what goes on a volunteering certificate, so shifts whose hours do
 * not parse are left out of the sum rather than counted as zero-length — the
 * total has to be defensible, and `countedShifts` says how much of the rota it
 * actually covers.
 */
export function totalHours(shifts: ShiftTime[]): { hours: number; countedShifts: number } {
  let minutes = 0;
  let countedShifts = 0;

  for (const s of shifts) {
    const d = durationMinutes(s);
    if (d === null) continue;
    minutes += d;
    countedShifts++;
  }

  return { hours: Math.round((minutes / 60) * 10) / 10, countedShifts };
}

/** Shifts in the order they happen, with unparseable times last. */
export function byStartTime<T extends ShiftTime>(shifts: T[]): T[] {
  const dayRank = (d: string) => (d === 'dayOne' ? 0 : d === 'dayTwo' ? 1 : 2);
  return [...shifts].sort((a, b) => {
    if (a.day !== b.day) return dayRank(a.day) - dayRank(b.day);
    const as = minutesOfDay(a.startTime);
    const bs = minutesOfDay(b.startTime);
    if (as === null && bs === null) return 0;
    if (as === null) return 1;
    if (bs === null) return -1;
    return as - bs;
  });
}
