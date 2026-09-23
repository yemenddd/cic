import type { AttendanceMethod, Checkpoint, CheckpointKind } from '@prisma/client';
import { CONFERENCE_DAYS, VENUE_UTC_OFFSET_HOURS } from '@/lib/conference';

/**
 * The vocabulary and the arithmetic of attendance — days, labels, outcomes,
 * turnout, and which checkpoint a scanner should open on.
 *
 * Deliberately free of `node:crypto` and of Prisma queries, and this is a
 * structural decision rather than a stylistic one: the scanner UI and the
 * attendance panels are Client Components, and an import of the signing key
 * here would be bundled into the browser build. It once was — the build
 * failed on `node:crypto` rather than shipping it, which is the good outcome,
 * but only by luck of the bundler.
 *
 * Everything that touches the database or the badge secret lives in
 * lib/attendance-record.ts, which only ever runs on the server.
 *
 * Only type imports from @prisma/client here: those are erased at compile
 * time, so they cost the client nothing.
 */

export type DayKey = 'dayOne' | 'dayTwo';

export const DAY_KEYS: DayKey[] = ['dayOne', 'dayTwo'];

export const DAY_LABELS: Record<DayKey, string> = {
  dayOne: 'اليوم الأول',
  dayTwo: 'اليوم الثاني',
};

export const CHECKPOINT_KIND_LABELS: Record<CheckpointKind, string> = {
  GATE: 'بوابة',
  SESSION: 'جلسة',
};

export const ATTENDANCE_METHOD_LABELS: Record<AttendanceMethod, string> = {
  QR: 'مسح QR',
  MANUAL: 'إدخال يدوي',
};

export function isDayKey(value: string): value is DayKey {
  return (DAY_KEYS as string[]).includes(value);
}

export function dayLabel(day: string): string {
  return isDayKey(day) ? DAY_LABELS[day] : day;
}

/**
 * Which conference day `now` falls on, by the venue's calendar — or null on
 * every other day of the year.
 *
 * Istanbul local, not the server's zone: a scan at 00:30 on day two is day
 * two to everyone standing in the room, and a Vercel instance running in UTC
 * would file it under day one.
 */
export function activeDayKey(now: Date = new Date()): DayKey | null {
  for (const key of DAY_KEYS) {
    const { y, m, d } = CONFERENCE_DAYS[key];
    const start = Date.UTC(y, m - 1, d, -VENUE_UTC_OFFSET_HOURS);
    if (now.getTime() >= start && now.getTime() < start + 86_400_000) return key;
  }
  return null;
}

// ─── what a scan can come to ─────────────────────────────────────────────────

export interface ScannedAttendee {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  organization: string | null;
  confirmationCode: string | null;
}

export type CheckInOutcome =
  /** Counted just now. */
  | { status: 'recorded'; attendee: ScannedAttendee; at: Date; method: AttendanceMethod }
  /** Already counted here — the badge was scanned twice. */
  | { status: 'duplicate'; attendee: ScannedAttendee; at: Date; method: AttendanceMethod }
  /** Readable, but no account answers to it. */
  | { status: 'unknown' }
  /**
   * A real badge, belonging to somebody the committee has not admitted.
   *
   * Registering and being admitted are two different things, and the door is
   * where that distinction finally means something: a participant or volunteer
   * whose application is still waiting — or was refused — must not be counted
   * through the gate on the strength of a pass they were handed at signup.
   */
  | { status: 'not-admitted'; attendee: ScannedAttendee; accountStatus: 'PENDING' | 'REJECTED' }
  /** Not a badge of ours at all. */
  | { status: 'unreadable' }
  /** The checkpoint is closed, or was deleted while the scanner was open. */
  | { status: 'closed'; checkpointName: string }
  | { status: 'no-checkpoint' };

export const OUTCOME_LABELS: Record<CheckInOutcome['status'], string> = {
  recorded: 'تم تسجيل الحضور',
  duplicate: 'مسجَّل مسبقاً',
  unknown: 'لا يوجد حساب بهذا الرمز',
  'not-admitted': 'لم يُقبل هذا الحساب بعد',
  unreadable: 'رمز غير صالح',
  closed: 'نقطة الحضور مغلقة',
  'no-checkpoint': 'اختر نقطة حضور أولاً',
};

// ─── the checkpoints themselves ──────────────────────────────────────────────

/**
 * The two doors the conference has whether or not anybody configured them.
 *
 * The scanner has to work the first time it is opened, at a desk, with a queue
 * already forming — "create a checkpoint first" is not an acceptable first
 * screen on the morning of day one.
 *
 * The ids are fixed rather than generated, and that is the whole point: two
 * requests arriving together — the dashboard and the scanner opened in two
 * tabs — would both find the table empty and both insert, leaving the venue
 * with two "بوابة اليوم الأول" and its arrivals split between them. Known ids
 * make the second insert a no-op instead of a race. (Observed, not theorised:
 * the first smoke test of this feature produced four gates.)
 */
export function defaultCheckpoints(): { id: string; nameAr: string; day: DayKey; order: number }[] {
  return DAY_KEYS.map((day, i) => ({
    id: `gate-${day}`,
    nameAr: `بوابة ${DAY_LABELS[day]}`,
    day,
    order: i,
  }));
}

/**
 * Which checkpoint a scanner should open on.
 *
 * Today's open gate, if the conference is running — so on the morning of day
 * one the desk opens the scanner and starts scanning, with nothing to choose.
 * Otherwise the first open checkpoint, so a rehearsal the week before still
 * has something selected.
 */
export function suggestedCheckpoint<T extends Pick<Checkpoint, 'id' | 'day' | 'kind' | 'isOpen'>>(
  checkpoints: T[],
  now: Date = new Date(),
): T | null {
  const open = checkpoints.filter((c) => c.isOpen);
  if (open.length === 0) return null;

  const today = activeDayKey(now);
  if (today) {
    const gate = open.find((c) => c.day === today && c.kind === 'GATE');
    if (gate) return gate;
    const any = open.find((c) => c.day === today);
    if (any) return any;
  }

  return open.find((c) => c.kind === 'GATE') ?? open[0];
}

/**
 * Turnout as a whole percent, rounded down.
 *
 * Rounded down on purpose: "97%" when three people are still outside is a
 * figure an organizer would act on, and 100% must mean everyone.
 */
export function attendanceRate(present: number, total: number): number {
  if (total <= 0) return 0;
  return Math.floor((Math.min(present, total) / total) * 100);
}
