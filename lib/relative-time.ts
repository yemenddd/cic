/**
 * "منذ ..." for recent moments, falling back to a plain date once the exact
 * day matters more than the distance.
 *
 * Shared by the notification feed and the admin activity stream so the two
 * never phrase the same interval differently.
 */

/**
 * Arabic does not have one plural. A count takes four different forms:
 * singular, a dual, a "few" plural for 3–10, and back to the singular noun for
 * 11 and above. Writing `${n} دقيقة` for everything — which is what this used
 * to do — produces "قبل 4 دقيقة", which reads to an Arabic speaker roughly the
 * way "4 minute ago" reads in English.
 */
interface ArabicUnit {
  /** e.g. دقيقة */
  one: string;
  /** e.g. دقيقتان */
  two: string;
  /** e.g. دقائق — used for 3 through 10 */
  few: string;
  /** e.g. دقيقة — the singular again, for 11 and above */
  many: string;
}

const MINUTE: ArabicUnit = { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' };
const HOUR: ArabicUnit = { one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' };
const DAY: ArabicUnit = { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' };

function countPhrase(n: number, unit: ArabicUnit): string {
  // The dual carries the number in the word itself, so "قبل دقيقتين" is right
  // and "قبل 2 دقيقتين" is not.
  if (n === 1) return unit.one;
  if (n === 2) return unit.two;
  if (n <= 10) return `${n} ${unit.few}`;
  return `${n} ${unit.many}`;
}

export function relativeArabicDate(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  // A clock skew or a row written a second in the future should read as "now",
  // not as a negative number of minutes ago.
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${countPhrase(minutes, MINUTE)}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${countPhrase(hours, HOUR)}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${countPhrase(days, DAY)}`;

  return date.toLocaleDateString('ar');
}
