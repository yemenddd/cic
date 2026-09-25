/**
 * Numbers, written the way a machine can read them.
 *
 * An Arabic keyboard produces Arabic-Indic digits — ٠١٢٣٤٥٦٧٨٩ — and a Persian
 * or Urdu one produces the Eastern set, ۰۱۲۳۴۵۶۷۸۹. They are the same numbers
 * and a person reads them without noticing, but nothing else does: a phone
 * number stored as ٧٧٠١٢٣٤٥٦ cannot be dialled from a contacts app, cannot be
 * searched for by somebody typing it in Latin, and sorts as text rather than
 * as a number in an exported spreadsheet.
 *
 * So the digits are converted at the edges — as somebody types, and again on
 * the server — and everything inside the platform sees one script.
 *
 * Only the digits change. Everything else in the string is left exactly as it
 * was: a `+`, spaces, dashes and brackets are how people write phone numbers
 * and none of them are ambiguous.
 *
 * No imports, because the registration form is a client component and this has
 * to be usable on both sides.
 */

const ARABIC_INDIC_ZERO = 0x0660; // ٠
const EASTERN_ARABIC_INDIC_ZERO = 0x06f0; // ۰

export function toLatinDigits(raw: string | null | undefined): string {
  if (!raw) return '';

  return raw
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - EASTERN_ARABIC_INDIC_ZERO));
}

/**
 * A phone number as it should be stored.
 *
 * Digits converted, and the characters that are never part of a number
 * dropped — Arabic comma, Arabic-Indic thousands separators, and the
 * bidirectional control marks a right-to-left field can leave behind, which
 * are invisible in every interface and break an exact-match search.
 *
 * Deliberately not a validator: how somebody writes their own number is their
 * business, and refusing an unfamiliar shape at a registration desk costs more
 * than it saves. lib/walk-in.ts checks there are enough digits to be a number
 * at all, and that is the whole of the rule.
 */
export function normalizePhone(raw: string | null | undefined): string {
  return toLatinDigits(raw)
    // Bidi marks: LRM, RLM, ALM, and the isolate/embedding controls.
    .replace(/[‎‏؜⁦-⁩‪-‮]/g, '')
    .replace(/[٫٬،]/g, '')
    .trim();
}
