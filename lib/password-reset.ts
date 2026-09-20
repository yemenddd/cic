import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';
import { clearFailures } from '@/lib/rate-limit';
import { siteUrl } from '@/lib/site';

/**
 * Losing your password, and getting back in.
 *
 * With no notion of who is asking beyond the address typed into the form — the
 * guarding (throttles, the action wrapper) lives in the route that calls this,
 * the same split as announcements/send.ts.
 *
 * The rules this enforces, and why each one is here:
 *
 *   - The token is never stored, only its SHA-256. A read of the token table
 *     must not hand the reader a working link into every account with an
 *     outstanding reset.
 *   - Requesting a reset for an unknown address does the same visible work as
 *     requesting one for a real address, and returns the same answer. Any
 *     difference turns this form into a way to test which of a list of
 *     addresses holds an account.
 *   - A token is single-use and short-lived, and using one destroys every
 *     other outstanding token for that account: a reset means "I have lost
 *     control of this password", and older links in an inbox are exactly the
 *     thing that should stop working.
 */

/** One hour. Long enough to find the mail, short enough that a forwarded
 *  message or a shared screenshot stops working before it matters. */
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

/** The shortest password the reset form will set. Matches the account page. */
export const MIN_PASSWORD_LENGTH = 10;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * A reset token.
 *
 * 32 bytes of randomness, base64url so it survives being pasted out of a mail
 * client and back into an address bar without escaping.
 */
function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Only the shape the generator produces — anything else is not one of ours. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isTokenShape(token: string): boolean {
  return TOKEN_PATTERN.test(token.trim());
}

export function resetLink(token: string): string {
  return `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function resetMessage(name: string | null, link: string): string {
  const greeting = name?.trim() ? `مرحباً ${name.trim()}،` : 'مرحباً،';
  return `${greeting}

وصلنا طلب لإعادة تعيين كلمة مرور حسابك في منصة مؤتمر CICT.

افتح الرابط التالي لاختيار كلمة مرور جديدة:
${link}

الرابط صالح لمدة ساعة واحدة، ويعمل مرة واحدة فقط.

إن لم تطلب هذا، تجاهل هذه الرسالة — لم يتغيّر شيء في حسابك، وكلمة مرورك الحالية ما زالت تعمل.

فريق مؤتمر CICT`;
}

/**
 * Start a reset.
 *
 * Returns nothing about whether the address exists — on purpose. The caller
 * shows the same message either way.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  // No account: stop here, silently. Not an error, and not a different code
  // path the caller could time or otherwise distinguish.
  if (!user) return;

  const token = generateToken();

  // Any earlier request is abandoned the moment a new one is made, so a
  // mailbox never holds two live links into the same account.
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
      },
    }),
  ]);

  await sendEmail({
    to: user.email,
    subject: 'إعادة تعيين كلمة المرور — منصة مؤتمر CICT',
    text: resetMessage(user.name, resetLink(token)),
  });
}

export type TokenState =
  | { valid: true; userId: string }
  /** Expired, already spent, or never existed — one answer for all three. */
  | { valid: false };

/**
 * Is this token still good?
 *
 * The three failure modes collapse into one answer deliberately: telling
 * somebody holding a stale link that it "expired" rather than "was not found"
 * confirms that it was once real, and therefore that the address it was sent
 * to holds an account.
 */
export async function checkResetToken(rawToken: string): Promise<TokenState> {
  const token = rawToken.trim();
  if (!isTokenShape(token)) return { valid: false };

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { userId: true, expiresAt: true, usedAt: true, tokenHash: true },
  });
  if (!row) return { valid: false };

  // The lookup above already proved equality through the unique index; this
  // guards against a future refactor that finds the row some other way.
  const expected = Buffer.from(row.tokenHash);
  const actual = Buffer.from(hashToken(token));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return { valid: false };

  if (row.usedAt) return { valid: false };
  if (row.expiresAt.getTime() <= Date.now()) return { valid: false };

  return { valid: true, userId: row.userId };
}

export type ResetOutcome =
  | { status: 'ok' }
  | { status: 'invalid-token' }
  | { status: 'weak-password' };

/** Spend the token and set the new password. */
export async function completePasswordReset(
  rawToken: string,
  newPassword: string,
): Promise<ResetOutcome> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { status: 'weak-password' };

  const state = await checkResetToken(rawToken);
  if (!state.valid) return { status: 'invalid-token' };

  const account = await prisma.user.findUnique({
    where: { id: state.userId },
    select: { email: true },
  });
  if (!account) return { status: 'invalid-token' };

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // One transaction: a password changed without the token being spent leaves a
  // live link in an inbox, and a token spent without the password changing
  // locks the person out of their own reset.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: state.userId },
      // Stamped so lib/auth-guards.ts can refuse tokens minted before now. A
      // reset means "somebody else may have my password" — leaving their
      // existing session alive for its full 30 days would defeat the point.
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: { tokenHash: hashToken(rawToken.trim()) },
      data: { usedAt: new Date() },
    }),
    // Every other outstanding link for this account dies with it.
    prisma.passwordResetToken.deleteMany({ where: { userId: state.userId, usedAt: null } }),
  ]);

  // Whoever just proved they own the address should not then be told to wait
  // fifteen minutes because of the failed guesses that sent them here.
  await clearFailures('login:email', account.email);

  return { status: 'ok' };
}

/**
 * Drop tokens nobody can use any more.
 *
 * Called opportunistically, like pruneThrottles: the table would otherwise
 * grow forever under a script hammering the request form, and a cron job for
 * a handful of rows is not worth its own moving part.
 */
export async function pruneResetTokens(): Promise<void> {
  if (Math.random() > 0.05) return;
  try {
    await prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  } catch {
    // Housekeeping must never turn into a failed reset.
  }
}
