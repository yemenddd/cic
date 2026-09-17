// Clash detection for an attendee's personal agenda.
//
// Deliberately pure and time-source-free: it takes sessions that have ALREADY
// been resolved to absolute intervals (by resolveSessionInterval in lib/ics.ts,
// the same resolver the .ics export uses) and answers only "which of these
// overlap?". That keeps the one fragile part — turning a free-text `time` into
// a timestamp — in a single place, so the calendar export and the clash warning
// can never disagree about when a session starts.
//
// ─── TWO RULES THAT MATTER ───
//   1. Touching is NOT clashing. 10:00–11:00 and 11:00–12:00 are back to back,
//      which is the normal shape of a conference program; reporting that as a
//      conflict would flag almost every agenda. Overlap is strict on both ends.
//   2. An unresolved time (start === null) NEVER clashes with anything. A false
//      alarm is worse than no alarm: an attendee who is warned about a
//      non-conflict learns to ignore the warning entirely. Days are already
//      handled by rule 1's arithmetic — intervals carry their real date, so the
//      same clock time on dayOne and dayTwo is hours apart and cannot overlap.

/** A session with its resolved interval; null start/end means "unknown time". */
export type AgendaItem = {
  id: string;
  start: Date | null;
  end: Date | null;
};

type ResolvedItem = { id: string; start: number; end: number };

/** Drop items with no usable interval, so they can never be reported as clashing. */
function resolved(items: AgendaItem[]): ResolvedItem[] {
  const out: ResolvedItem[] = [];

  for (const item of items) {
    if (!item.start || !item.end) continue;
    const start = item.start.getTime();
    const end = item.end.getTime();
    // A zero-length or inverted interval can't meaningfully overlap anything.
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    out.push({ id: item.id, start, end });
  }

  return out;
}

/** Strict overlap: sessions that merely touch at an endpoint do not clash. */
function overlaps(a: ResolvedItem, b: ResolvedItem): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Ids of every session that overlaps at least one other session in the list.
 * Items with an unknown time are absent from the result by construction.
 */
export function findClashingIds(items: AgendaItem[]): Set<string> {
  const list = resolved(items);
  const clashing = new Set<string>();

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (overlaps(list[i], list[j])) {
        clashing.add(list[i].id);
        clashing.add(list[j].id);
      }
    }
  }

  return clashing;
}

/**
 * How many distinct pairs overlap — the number quoted in the summary line.
 * Three sessions all at 10:00 are three pairs, not one, which is the honest
 * count of decisions the attendee still has to make.
 */
export function countClashPairs(items: AgendaItem[]): number {
  const list = resolved(items);
  let pairs = 0;

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (overlaps(list[i], list[j])) pairs += 1;
    }
  }

  return pairs;
}

/**
 * Would adding `candidate` to `items` create a clash? Used for the pre-save
 * hint in the full program list. Compares by id so a session already in the
 * list never counts as clashing with itself.
 */
export function clashesWithAny(candidate: AgendaItem, items: AgendaItem[]): boolean {
  const [self] = resolved([candidate]);
  if (!self) return false;

  return resolved(items).some((other) => other.id !== self.id && overlaps(self, other));
}
