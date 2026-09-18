/**
 * Counting in Arabic.
 *
 * Arabic does not have one plural. A count takes four different forms:
 * singular, a dual, a "few" plural for 3–10, and back to the singular noun for
 * 11 and above. Writing `${n} جلسة` for everything produces "4 جلسة", which
 * reads to an Arabic speaker roughly the way "4 session" reads in English.
 *
 * Every count rendered in the platform goes through here so that mistake can
 * only be made in one place.
 */

export interface ArabicUnit {
  /** e.g. دقيقة */
  one: string;
  /** e.g. دقيقتين — carries the number inside the word */
  two: string;
  /** e.g. دقائق — used for 3 through 10 */
  few: string;
  /** e.g. دقيقة — the singular again, for 11 and above */
  many: string;
}

export const MINUTE: ArabicUnit = { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' };
export const HOUR: ArabicUnit = { one: 'ساعة', two: 'ساعتين', few: 'ساعات', many: 'ساعة' };
export const DAY: ArabicUnit = { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' };
export const SESSION: ArabicUnit = { one: 'جلسة', two: 'جلستين', few: 'جلسات', many: 'جلسة' };
export const CLASH: ArabicUnit = { one: 'تعارض', two: 'تعارضين', few: 'تعارضات', many: 'تعارضاً' };
export const PROJECT: ArabicUnit = { one: 'مشروع', two: 'مشروعين', few: 'مشاريع', many: 'مشروعاً' };

/**
 * "4 جلسات", "جلستين", "جلسة واحدة".
 *
 * The dual carries the number in the word itself, so "جلستين" is right and
 * "2 جلستين" is not — which is why this returns the whole phrase rather than
 * just the noun for the caller to prefix with a digit.
 */
export function arabicCount(n: number, unit: ArabicUnit): string {
  if (n === 1) return `${unit.one} واحدة`;
  if (n === 2) return unit.two;
  if (n <= 10) return `${n} ${unit.few}`;
  return `${n} ${unit.many}`;
}

/** The same, without the "واحدة" that suits a standalone count but not a phrase. */
export function arabicCountBare(n: number, unit: ArabicUnit): string {
  if (n === 1) return unit.one;
  if (n === 2) return unit.two;
  if (n <= 10) return `${n} ${unit.few}`;
  return `${n} ${unit.many}`;
}
