import { arabicCountBare, MINUTE, HOUR, DAY } from '@/lib/arabic-plural';

/**
 * "منذ ..." for recent moments, falling back to a plain date once the exact
 * day matters more than the distance.
 *
 * Shared by the notification feed and the admin activity stream so the two
 * never phrase the same interval differently. The count forms come from
 * lib/arabic-plural.ts — Arabic has four of them, not two.
 */
export function relativeArabicDate(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  // A clock skew or a row written a second in the future should read as "now",
  // not as a negative number of minutes ago.
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `قبل ${arabicCountBare(minutes, MINUTE)}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${arabicCountBare(hours, HOUR)}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `قبل ${arabicCountBare(days, DAY)}`;

  return date.toLocaleDateString('ar');
}
