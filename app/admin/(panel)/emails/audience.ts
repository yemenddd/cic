import { CATEGORIES } from '@/lib/categories';

// Kept out of actions.ts because a 'use server' module may only export async
// functions — a plain constant or a sync helper there is a build error.

export const MAIL_ALL = 'all';
/**
 * Everybody a scanner counted through a gate, on either day.
 *
 * The one audience that cannot be expressed as a tier: after the conference,
 * "who was actually there" and "who signed up" are different lists — on the
 * first day they differed by more than half — and a thank-you addressed to
 * people who did not come reads as a form letter to all of them.
 */
export const MAIL_ATTENDED = 'attended';
/** One address, typed in by hand. */
export const MAIL_ONE = 'one';

/**
 * Who a message can be addressed to.
 *
 * The four shapes an organizer actually asks for: everybody, everybody who
 * turned up, one tier, or one person. There is deliberately no free-text
 * list of addresses — a
 * field somebody pastes forty addresses into is a field somebody pastes the
 * wrong forty addresses into, and the platform already knows who is registered.
 */
export function mailAudienceOptions() {
  return [
    { value: MAIL_ALL, label: 'كل المسجَّلين' },
    { value: MAIL_ATTENDED, label: 'من حضروا المؤتمر فعلاً' },
    ...CATEGORIES.map((c) => ({ value: c.id, label: `فئة «${c.labels.ar}» فقط` })),
    { value: MAIL_ONE, label: 'شخص معيّن (بريد واحد)' },
  ];
}

export function mailAudienceLabel(audience: string): string {
  return mailAudienceOptions().find((o) => o.value === audience)?.label ?? audience;
}
