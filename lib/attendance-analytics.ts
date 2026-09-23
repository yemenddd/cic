import type { AttendanceMethod } from '@prisma/client';
import { VENUE_UTC_OFFSET_HOURS } from '@/lib/conference';
import type { DayKey } from '@/lib/attendance';

/**
 * What the door actually learned.
 *
 * The attendance page answers "how many so far", which is the question during
 * the conference. This answers the questions asked after it, when somebody is
 * deciding how to run the next one: how many of the people who registered
 * actually came, when they arrived, how long the rush lasted, how many had to
 * be checked in by hand because the badge failed, and how many turned up
 * having never registered at all.
 *
 * Every function here is pure — it takes rows and returns numbers — so the
 * figures can be checked without a database, and so the report and any export
 * of it can never disagree.
 */

export interface AttendanceRow {
  userId: string;
  checkpointId: string;
  checkedInAt: Date;
  method: AttendanceMethod;
  recordedById: string | null;
}

export interface AttendeeFacts {
  id: string;
  category: string | null;
  country: string | null;
  organization: string | null;
  /** Added at the door rather than through the registration form. */
  walkIn: boolean;
}

export interface CheckpointFacts {
  id: string;
  nameAr: string;
  day: string;
}

/** Minutes from midnight at the venue, for a moment stored in UTC. */
export function venueMinutes(at: Date): number {
  const shifted = new Date(at.getTime() + VENUE_UTC_OFFSET_HOURS * 3600_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** "14:30" for a minute-of-day, always two digits, always venue time. */
export function clockLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── turnout ─────────────────────────────────────────────────────────────────

export interface Turnout {
  /** Accounts that could have attended — walk-ins excluded, see below. */
  registered: number;
  /** Distinct people the door counted, once each however many times scanned. */
  attended: number;
  /** Registered and never seen. The figure that decides next year's catering. */
  noShows: number;
  /** Of those counted, how many never registered in advance. */
  walkIns: number;
  /** Attended ÷ registered, as a whole percent. */
  rate: number;
}

/**
 * Turnout, counted honestly.
 *
 * Walk-ins are kept out of `registered` and reported on their own. They were
 * created by the door itself, so counting them as registrations would make the
 * turnout rate climb every time somebody was admitted at the desk — a metric
 * that improves when registration fails is worse than no metric.
 */
export function turnout(attendees: AttendeeFacts[], rows: AttendanceRow[]): Turnout {
  const seen = new Set(rows.map((r) => r.userId));

  let registered = 0;
  let attended = 0;
  let walkIns = 0;

  for (const person of attendees) {
    const came = seen.has(person.id);
    if (person.walkIn) {
      if (came) walkIns++;
      continue;
    }
    registered++;
    if (came) attended++;
  }

  return {
    registered,
    attended,
    noShows: registered - attended,
    walkIns,
    rate: registered > 0 ? Math.round((attended / registered) * 100) : 0,
  };
}

export interface CategoryTurnout {
  category: string;
  registered: number;
  attended: number;
  rate: number;
}

/**
 * Turnout per category.
 *
 * The single most actionable cut: if participants show up at 90% and visitors
 * at 40%, the conference has a visitor problem, not an attendance problem, and
 * the fix is in how visitors are invited rather than in the door.
 */
export function turnoutByCategory(
  attendees: AttendeeFacts[],
  rows: AttendanceRow[],
): CategoryTurnout[] {
  const seen = new Set(rows.map((r) => r.userId));
  const byCategory = new Map<string, { registered: number; attended: number }>();

  for (const person of attendees) {
    if (person.walkIn) continue;
    const key = person.category ?? '';
    const entry = byCategory.get(key) ?? { registered: 0, attended: 0 };
    entry.registered++;
    if (seen.has(person.id)) entry.attended++;
    byCategory.set(key, entry);
  }

  return [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      registered: v.registered,
      attended: v.attended,
      rate: v.registered > 0 ? Math.round((v.attended / v.registered) * 100) : 0,
    }))
    .sort((a, b) => b.registered - a.registered);
}

// ─── when they arrived ───────────────────────────────────────────────────────

export interface ArrivalBucket {
  /** Minutes from midnight at the venue, at the start of the bucket. */
  startMinutes: number;
  label: string;
  count: number;
}

export interface ArrivalCurve {
  buckets: ArrivalBucket[];
  /** The busiest bucket, which is what the door has to be staffed for. */
  peak: ArrivalBucket | null;
  /** The first arrival of the day. */
  firstMinutes: number | null;
  lastMinutes: number | null;
  /** The bucket by which half of the day's arrivals had come through. */
  medianMinutes: number | null;
  total: number;
}

/**
 * When people came through the door, in buckets.
 *
 * The average arrival time is useless here — arrivals are not spread evenly,
 * they come in one wave before the opening and a long tail afterwards. The
 * peak bucket and the median are what tell somebody how many volunteers to put
 * on a door and for how long.
 */
export function arrivalCurve(rows: AttendanceRow[], bucketMinutes = 30): ArrivalCurve {
  if (rows.length === 0) {
    return { buckets: [], peak: null, firstMinutes: null, lastMinutes: null, medianMinutes: null, total: 0 };
  }

  const minutes = rows.map((r) => venueMinutes(r.checkedInAt)).sort((a, b) => a - b);
  const first = minutes[0];
  const last = minutes[minutes.length - 1];

  const firstBucket = Math.floor(first / bucketMinutes) * bucketMinutes;
  const lastBucket = Math.floor(last / bucketMinutes) * bucketMinutes;

  const counts = new Map<number, number>();
  for (let b = firstBucket; b <= lastBucket; b += bucketMinutes) counts.set(b, 0);
  for (const m of minutes) {
    const b = Math.floor(m / bucketMinutes) * bucketMinutes;
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }

  const buckets: ArrivalBucket[] = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([startMinutes, count]) => ({
      startMinutes,
      label: clockLabel(startMinutes),
      count,
    }));

  const peak = buckets.reduce<ArrivalBucket | null>(
    (best, b) => (best === null || b.count > best.count ? b : best),
    null,
  );

  return {
    buckets,
    peak,
    firstMinutes: first,
    lastMinutes: last,
    medianMinutes: minutes[Math.floor(minutes.length / 2)],
    total: rows.length,
  };
}

// ─── coming back ─────────────────────────────────────────────────────────────

export interface DayRetention {
  /** Distinct people counted on day one. */
  dayOne: number;
  dayTwo: number;
  /** Counted on both days — the number that says whether day two was worth it. */
  both: number;
  /** Day one only: they came and did not return. */
  dayOneOnly: number;
  /** Day two only: they arrived late to the conference, not to the door. */
  dayTwoOnly: number;
  /** Of day one's crowd, the share that came back. */
  returnRate: number;
}

/**
 * Who came back for the second day.
 *
 * Day two attendance on its own is ambiguous — it could be the same crowd or a
 * different one, and the two mean opposite things about the programme. The
 * overlap is what separates them.
 */
export function dayRetention(
  rows: AttendanceRow[],
  checkpoints: CheckpointFacts[],
): DayRetention {
  const dayOf = new Map(checkpoints.map((c) => [c.id, c.day]));

  const one = new Set<string>();
  const two = new Set<string>();

  for (const row of rows) {
    const day = dayOf.get(row.checkpointId);
    if (day === 'dayOne') one.add(row.userId);
    else if (day === 'dayTwo') two.add(row.userId);
  }

  let both = 0;
  for (const id of one) if (two.has(id)) both++;

  return {
    dayOne: one.size,
    dayTwo: two.size,
    both,
    dayOneOnly: one.size - both,
    dayTwoOnly: two.size - both,
    returnRate: one.size > 0 ? Math.round((both / one.size) * 100) : 0,
  };
}

// ─── how they were counted ───────────────────────────────────────────────────

export interface MethodSplit {
  qr: number;
  manual: number;
  /** Manual as a share of everything — a badge-health number, not a staff one. */
  manualRate: number;
}

/**
 * Scanned versus typed in by hand.
 *
 * A high manual share is not an organizer problem: it means the badges were
 * not working — not printed, not saved, phone dead, camera refusing. It is the
 * clearest signal the platform gets about whether the pass it issues survives
 * contact with a real door.
 */
export function methodSplit(rows: AttendanceRow[]): MethodSplit {
  let qr = 0;
  let manual = 0;
  for (const row of rows) {
    if (row.method === 'QR') qr++;
    else manual++;
  }
  const total = qr + manual;
  return { qr, manual, manualRate: total > 0 ? Math.round((manual / total) * 100) : 0 };
}

// ─── per door ────────────────────────────────────────────────────────────────

export interface CheckpointLoad {
  id: string;
  nameAr: string;
  day: string;
  count: number;
  /** The busiest half-hour at this door specifically. */
  peakLabel: string | null;
  peakCount: number;
}

export function checkpointLoad(
  rows: AttendanceRow[],
  checkpoints: CheckpointFacts[],
  bucketMinutes = 30,
): CheckpointLoad[] {
  const byCheckpoint = new Map<string, AttendanceRow[]>();
  for (const row of rows) {
    const list = byCheckpoint.get(row.checkpointId) ?? [];
    list.push(row);
    byCheckpoint.set(row.checkpointId, list);
  }

  return checkpoints
    .map((c) => {
      const own = byCheckpoint.get(c.id) ?? [];
      const curve = arrivalCurve(own, bucketMinutes);
      return {
        id: c.id,
        nameAr: c.nameAr,
        day: c.day,
        count: own.length,
        peakLabel: curve.peak?.label ?? null,
        peakCount: curve.peak?.count ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count);
}

// ─── where they came from ────────────────────────────────────────────────────

export interface Ranked {
  label: string;
  count: number;
}

/**
 * The commonest values among the people who actually attended.
 *
 * Deliberately over attendees rather than over registrations: the list of
 * countries that registered and the list that turned up are different lists,
 * and only the second one describes the room.
 */
export function rankAttended(
  attendees: AttendeeFacts[],
  rows: AttendanceRow[],
  field: 'country' | 'organization',
  limit = 8,
): Ranked[] {
  const seen = new Set(rows.map((r) => r.userId));
  const counts = new Map<string, number>();

  for (const person of attendees) {
    if (!seen.has(person.id)) continue;
    const value = person[field]?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ar'))
    .slice(0, limit);
}

// ─── who was holding the scanner ─────────────────────────────────────────────

export interface RecorderLoad {
  recordedById: string | null;
  count: number;
}

/**
 * How the scanning was distributed across the team.
 *
 * Not a leaderboard — it is a staffing read. One person having done 400 scans
 * and four others 20 each means the door was one person deep, whatever the
 * rota said.
 */
export function byRecorder(rows: AttendanceRow[]): RecorderLoad[] {
  const counts = new Map<string | null, number>();
  for (const row of rows) counts.set(row.recordedById, (counts.get(row.recordedById) ?? 0) + 1);

  return [...counts.entries()]
    .map(([recordedById, count]) => ({ recordedById, count }))
    .sort((a, b) => b.count - a.count);
}

/** The day a checkpoint belongs to, for grouping rows without a second query. */
export function rowsForDay(
  rows: AttendanceRow[],
  checkpoints: CheckpointFacts[],
  day: DayKey,
): AttendanceRow[] {
  const ids = new Set(checkpoints.filter((c) => c.day === day).map((c) => c.id));
  return rows.filter((r) => ids.has(r.checkpointId));
}
