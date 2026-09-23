/**
 * Somebody who turned up without registering.
 *
 * The door has to be able to admit them in about ten seconds, standing up,
 * with a queue behind them — so it asks for a name and a phone number and
 * nothing else. Everything the schema needs beyond that is manufactured here,
 * in one place, rather than improvised at the call site.
 *
 * They become a real attendee row: they count in the turnout, they appear in
 * the export, and they can be handed a badge. They do not become a user —
 * there is no password that can ever match, and the address on the row cannot
 * receive mail and is not pretending to.
 *
 * Pure, so the rules can be checked without a database.
 */

/**
 * The address a walk-in gets.
 *
 * `.invalid` is reserved by RFC 2606 precisely so it can never resolve, which
 * is the honest way to record "this person did not give us an address". A
 * plausible-looking placeholder on a real domain would eventually be mailed,
 * and would bounce — or worse, reach a stranger.
 *
 * The confirmation code makes it unique without a lookup, and the column is
 * unique, so two people added at the same desk in the same second cannot
 * collide.
 */
export const WALK_IN_EMAIL_DOMAIN = 'walk-in.cic.invalid';

export function walkInEmail(confirmationCode: string): string {
  return `${confirmationCode.toLowerCase()}@${WALK_IN_EMAIL_DOMAIN}`;
}

/** Is this an address the platform invented rather than one a person gave? */
export function isWalkInEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${WALK_IN_EMAIL_DOMAIN}`));
}

export interface WalkInInput {
  name: string;
  phone: string;
  category: string;
  organization?: string;
  country?: string;
}

export interface WalkInFields {
  name: string;
  phone: string;
  category: string;
  organization: string | null;
  country: string | null;
}

/**
 * What is wrong with what the desk typed, in the desk's terms.
 *
 * Deliberately forgiving about the phone number: it is written down so an
 * organizer can call somebody about a lost bag, not so a system can dial it.
 * Rejecting a number because of how its country code was written would mean
 * arguing with a volunteer while a queue waits.
 */
export function validateWalkIn(input: WalkInInput): string | null {
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (name.length < 2) return 'اكتب اسم الحاضر';
  if (name.length > 200) return 'الاسم طويل جداً';

  if (!phone) return 'رقم الهاتف مطلوب';
  if (phone.length > 50) return 'رقم الهاتف طويل جداً';
  // At least a few actual digits. "لا يوجد" is not a phone number, and a row
  // that says it is one is worse than a row that admits the field was skipped.
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return 'رقم الهاتف غير مكتمل';

  if (!input.category) return 'اختر فئة الحاضر';

  return null;
}

/** The input, trimmed and shaped for the row. */
export function walkInFields(input: WalkInInput): WalkInFields {
  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    category: input.category,
    organization: input.organization?.trim() || null,
    country: input.country?.trim() || null,
  };
}
