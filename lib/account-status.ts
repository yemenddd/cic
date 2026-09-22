/**
 * Registering and being admitted are two different things.
 *
 * Anybody may fill in the form. Presenting a project, or joining the team that
 * runs the conference, is something the organizing committee decides — so a
 * participant's or a volunteer's account is created and then waits. A visitor
 * is admitted on the spot: attending a public session is what the form is for,
 * and making people wait for it would be a queue with nothing at the end.
 *
 * No imports: this is read by the sign-in screen, which is a client component,
 * as well as by the server. A module that reaches for the database or for
 * node:crypto here would fail the client bundle.
 */

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** The categories whose accounts wait for a decision. */
const NEEDS_APPROVAL = new Set(['participant', 'volunteer']);

export function needsApproval(categoryId: string | null | undefined): boolean {
  return Boolean(categoryId && NEEDS_APPROVAL.has(categoryId));
}

/** The status a newly registered account starts in. */
export function initialStatus(categoryId: string | null | undefined): AccountStatus {
  return needsApproval(categoryId) ? 'PENDING' : 'APPROVED';
}

export const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: 'بانتظار الموافقة',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض',
};

export const STATUS_COLORS: Record<AccountStatus, string> = {
  PENDING: 'var(--accent-violet)',
  APPROVED: 'var(--accent-cyan)',
  REJECTED: 'var(--destructive)',
};

/**
 * Why sign-in was refused, said to the person trying.
 *
 * Deliberately not the same message as a wrong password. Somebody whose
 * account is waiting would otherwise retype their password all evening
 * convinced they had forgotten it, and somebody who was refused would keep
 * waiting for an answer that has already been given.
 *
 * It does reveal that the address has an account — but that address just
 * registered with it, and the alternative is a dead end with no explanation.
 */
export function signInRefusal(status: AccountStatus, note?: string | null): string | null {
  if (status === 'APPROVED') return null;

  if (status === 'REJECTED') {
    return note?.trim()
      ? `لم يُقبل طلب انضمامك: ${note.trim()}`
      : 'لم يُقبل طلب انضمامك. للاستفسار تواصل مع فريق تنظيم المؤتمر.';
  }

  return note?.trim()
    ? `حسابك بانتظار موافقة فريق التنظيم: ${note.trim()}`
    : 'حسابك بانتظار موافقة فريق التنظيم — سيصلك إشعار فور قبوله.';
}

/**
 * The code carried through Auth.js when sign-in is refused for this reason.
 *
 * Auth.js only lets a credentials provider return a short code string, so the
 * status travels as one and the screen turns it back into the sentence above.
 */
export const REFUSAL_CODE_PREFIX = 'account-';

/** Where the committee's note starts inside the code. */
const NOTE_SEPARATOR = '::';

/**
 * How much of the note travels.
 *
 * It rides inside the sign-in error code, which is a short string; a refusal
 * whose reason is three paragraphs would be truncated by something further
 * down the chain rather than here, and truncated badly.
 */
const MAX_NOTE = 180;

export function refusalCode(status: AccountStatus, note?: string | null): string {
  const base = `${REFUSAL_CODE_PREFIX}${status.toLowerCase()}`;
  const trimmed = note?.trim().replace(/\s+/g, ' ').slice(0, MAX_NOTE);
  return trimmed ? `${base}${NOTE_SEPARATOR}${trimmed}` : base;
}

export function statusFromRefusalCode(code: string): AccountStatus | null {
  if (!code.startsWith(REFUSAL_CODE_PREFIX)) return null;
  const rest = code.slice(REFUSAL_CODE_PREFIX.length).split(NOTE_SEPARATOR)[0].toUpperCase();
  return rest === 'PENDING' || rest === 'REJECTED' ? rest : null;
}

/**
 * The committee's own words, pulled back out of the code.
 *
 * The note has to travel with the refusal because the notification carrying it
 * is inside the account — and the account is precisely what they cannot open.
 * Without this, somebody refused is told only that they were refused, and the
 * reason an organizer sat down and typed reaches nobody.
 *
 * It is shown only to whoever has just proved they hold the password for that
 * address, so it discloses nothing they are not already entitled to.
 */
export function noteFromRefusalCode(code: string): string | null {
  if (!code.startsWith(REFUSAL_CODE_PREFIX)) return null;
  const at = code.indexOf(NOTE_SEPARATOR);
  if (at === -1) return null;
  return code.slice(at + NOTE_SEPARATOR.length).trim() || null;
}
