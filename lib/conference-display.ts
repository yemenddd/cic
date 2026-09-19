import { CONFERENCE_DAYS, daysUntilConference } from '@/lib/conference';
import { arabicCountBare, DAY } from '@/lib/arabic-plural';
import { dict } from '@/lib/dictionary';

/**
 * The conference's date range and countdown, as Arabic strings.
 *
 * Computed on the server and handed to client components as plain text: a
 * client component calling `new Date()` renders one number on the server and
 * possibly another after hydration, which React reports as a mismatch.
 *
 * Latin digits with Arabic month names, matching the panels.
 */

const DAY_ONLY = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });

export interface ConferenceDisplay {
  range: string;
  countdown: string;
  venue: string;
}

export function conferenceDisplay(now: Date = new Date()): ConferenceDisplay {
  const start = new Date(CONFERENCE_DAYS.dayOne.y, CONFERENCE_DAYS.dayOne.m - 1, CONFERENCE_DAYS.dayOne.d);
  const end = new Date(CONFERENCE_DAYS.dayTwo.y, CONFERENCE_DAYS.dayTwo.m - 1, CONFERENCE_DAYS.dayTwo.d);

  // Both days almost always share a month, and "2 أكتوبر – 3 أكتوبر" says it
  // twice; only spell it out on each side when they actually differ.
  const sameMonth = CONFERENCE_DAYS.dayOne.m === CONFERENCE_DAYS.dayTwo.m;
  const range = sameMonth
    ? `${DAY_ONLY.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`
    : `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`;

  // Never counts into negatives — the site already spent a month advertising a
  // date that had passed, and that is the same subtraction away.
  const days = daysUntilConference(now);
  const countdown =
    days > 0 ? `يتبقى ${arabicCountBare(days, DAY)}` : days === 0 ? 'اليوم' : 'انتهى';

  return { range, countdown, venue: dict.ar.registerPage.location };
}
