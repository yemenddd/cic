/**
 * The fourth edition, which has concluded.
 *
 * This file used to drive the public site: a countdown on the homepage, a date
 * chip in the header, the schema.org Event block, two badges and the calendar
 * export all read the dates from here. None of them do any more — the edition
 * is over, and a site that still advertises its date is a site advertising a
 * date in the past.
 *
 * What is left is the one place where those dates are still true: a
 * certificate. A certificate of participation states, in the past tense, that
 * its holder was somewhere on a given date, so the date belongs on it — and it
 * must come from a record of what happened, not from marketing copy that gets
 * rewritten between editions. That is the difference between this constant and
 * the one it replaced.
 *
 * A fifth edition adds its own dates here and gets its own forward-looking
 * copy; it does not overwrite these.
 */

export interface ConferenceDay {
  y: number;
  /** 1-based, as written on a calendar — not JavaScript's 0-based month. */
  m: number;
  d: number;
}

/** When the fourth edition was held. Istanbul, 2026. */
export const FOURTH_EDITION: Record<'first' | 'last', ConferenceDay> = {
  first: { y: 2026, m: 10, d: 2 },
  last: { y: 2026, m: 10, d: 3 },
};

/**
 * Istanbul is UTC+3 all year — Türkiye abolished daylight saving in 2016 — so
 * a fixed offset is correct rather than a convenient approximation.
 */
export const VENUE_UTC_OFFSET_HOURS = 3;

/** As printed on a certificate, in each of the two languages it carries. */
export const EDITION_DATE_AR = '2-3 أكتوبر 2026';
export const EDITION_DATE_EN = 'Oct 2–3, 2026';

/**
 * The moment the fourth edition ended — midnight at the end of its last day,
 * local time.
 */
export function conferenceEnd(): Date {
  const { y, m, d } = FOURTH_EDITION.last;
  // Hour 24 of the final day = 00:00 the next morning, shifted to UTC.
  return new Date(Date.UTC(y, m - 1, d, 24 - VENUE_UTC_OFFSET_HOURS, 0, 0));
}

/**
 * Has the edition a certificate would attest to finished?
 *
 * Kept as a function of the clock rather than hard-coded to `true`, because
 * that is what makes it still correct for a fifth edition: point the constant
 * at the new dates and the certificate gate closes again by itself, instead of
 * silently handing out certificates on day one.
 */
export function conferenceHasEnded(now: Date = new Date()): boolean {
  return now.getTime() >= conferenceEnd().getTime();
}
