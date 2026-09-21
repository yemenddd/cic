/**
 * When the conference happens — the one place that knows.
 *
 * This exists because moving the dates last time meant editing them in the
 * marketing copy, the schema.org block, two countdown targets, the Open Graph
 * card and the calendar export, and the calendar one stored them as
 * `{ y, m, d }` rather than a string, so a search for the old date skipped
 * straight past it and would have shipped every downloaded .ics on the wrong
 * day. Anything computed from the dates now reads them from here.
 *
 * The translated display strings in lib/dictionary.ts are still written out by
 * hand — they are prose in three languages, not a formatting of these numbers.
 */

export interface ConferenceDay {
  y: number;
  /** 1-based, as written on a calendar — not JavaScript's 0-based month. */
  m: number;
  d: number;
}

export const CONFERENCE_DAYS: Record<'dayOne' | 'dayTwo', ConferenceDay> = {
  dayOne: { y: 2026, m: 10, d: 2 },
  dayTwo: { y: 2026, m: 10, d: 3 },
};

/**
 * Istanbul is UTC+3 all year — Türkiye abolished daylight saving in 2016 — so
 * a fixed offset is correct rather than a convenient approximation.
 */
export const VENUE_UTC_OFFSET_HOURS = 3;

/** When the first session opens, as a real instant. */
export function conferenceStart(): Date {
  const { y, m, d } = CONFERENCE_DAYS.dayOne;
  return new Date(Date.UTC(y, m - 1, d, 9 - VENUE_UTC_OFFSET_HOURS, 0, 0));
}

/**
 * The moment the conference is over — midnight at the end of the second day,
 * local time.
 *
 * Exists because some things must not be issued before it. A certificate of
 * participation states, in the past tense, that its holder attended; handing
 * one out two weeks in advance makes it a false document and devalues the ones
 * held by people who actually turn up.
 */
export function conferenceEnd(): Date {
  const { y, m, d } = CONFERENCE_DAYS.dayTwo;
  // Hour 24 of the final day = 00:00 the next morning, shifted to UTC.
  return new Date(Date.UTC(y, m - 1, d, 24 - VENUE_UTC_OFFSET_HOURS, 0, 0));
}

export function conferenceHasEnded(now: Date = new Date()): boolean {
  return now.getTime() >= conferenceEnd().getTime();
}

/**
 * Have the doors opened?
 *
 * Separate from `conferenceHasEnded` because the interesting window for most
 * of what the dashboard shows is *during* the conference, not after it: an
 * attendance figure is worth showing from the first session onwards, and is
 * meaningless — a guaranteed zero — before it.
 *
 * Takes `now` as a defaulted parameter rather than reading the clock in the
 * body, which is the same shape as `daysUntilConference` above. It keeps the
 * impure call out of any component that renders the result.
 */
export function conferenceHasStarted(now: Date = new Date()): boolean {
  return now.getTime() >= conferenceStart().getTime();
}

/**
 * Whole days from `now` until the opening session.
 *
 * Negative once the conference has started, which is the caller's cue to stop
 * counting down — the site spent a month advertising a date that had passed,
 * and a countdown that quietly renders a negative number is how that happens
 * again.
 */
export function daysUntilConference(now: Date = new Date()): number {
  const ms = conferenceStart().getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}
