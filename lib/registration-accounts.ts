import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { CATEGORIES } from '@/lib/categories';
import { generateConfirmationCode, isCodeCollision } from '@/lib/confirmation-code';

/**
 * Giving a registration an account, with no notion of who is asking.
 *
 * Deliberately NOT in the 'use server' module beside it: every export of one
 * is a public POST endpoint, so an unguarded core living there would be a way
 * to mint accounts without being an admin at all. The action proves the caller
 * is an admin and then calls this — the same split as announcements/send.ts
 * and lib/attendance-record.ts.
 *
 * Keeping the two apart is also the only way this is testable. It was not,
 * while it lived inside the action: verifying it meant guessing Next.js action
 * ids out of a build manifest and POSTing at them, which mis-identified the
 * action and deleted the row under test.
 */

// Same alphabet as the user panel's generator: an organizer reads this out or
// pastes it into a message, and an ambiguous glyph becomes a support ticket.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const PASSWORD_LENGTH = 16;

export function generatePassword(): string {
  const size = PASSWORD_ALPHABET.length;
  // Bytes at or above the cutoff are discarded rather than folded in with `%`,
  // which would make the first characters of the alphabet measurably likelier.
  const cutoff = Math.floor(256 / size) * size;

  let password = '';
  while (password.length < PASSWORD_LENGTH) {
    for (const byte of randomBytes(PASSWORD_LENGTH)) {
      if (byte >= cutoff) continue;
      password += PASSWORD_ALPHABET[byte % size];
      if (password.length === PASSWORD_LENGTH) break;
    }
  }
  return password;
}

export type ReconcileOutcome =
  /** An account was made. The password exists only in this response. */
  | { status: 'created'; userId: string; email: string; password: string }
  /** An account already existed for the address; the registration now points at it. */
  | { status: 'linked'; userId: string }
  | { status: 'already-linked' }
  | { status: 'not-found' }
  | { status: 'no-email' }
  | { status: 'failed' };

export const RECONCILE_MESSAGES: Record<ReconcileOutcome['status'], string> = {
  created: 'تم إنشاء الحساب وربطه بالتسجيل',
  linked: 'كان لهذا البريد حساب بالفعل — تم ربط التسجيل به',
  'already-linked': 'هذا التسجيل مرتبط بحساب بالفعل',
  'not-found': 'التسجيل غير موجود',
  'no-email': 'هذا التسجيل بلا بريد إلكتروني — لا يمكن إنشاء حساب له',
  failed: 'تعذّر إنشاء الحساب، حاول مرة أخرى',
};

/**
 * Give a registration an account, or attach it to the one that already exists.
 *
 * Registrations taken before accounts existed — and any entered from paper
 * afterwards — have no owner, which means that person cannot sign in, has no
 * badge, has no QR code and cannot be scanned at the door.
 *
 * The two cases are kept apart rather than guessed between, because guessing
 * is how one person ends up with two accounts: if an account already holds the
 * address, the registration is simply attached to it and no password is
 * touched — that person already has one.
 */
export async function reconcileRegistrationAccount(
  registrationId: string,
): Promise<ReconcileOutcome> {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true, fullName: true, email: true, phone: true, country: true,
      organization: true, category: true, track: true, userId: true,
      confirmationCode: true,
    },
  });
  if (!registration) return { status: 'not-found' };
  if (registration.userId) return { status: 'already-linked' };

  const email = registration.email.trim().toLowerCase();
  if (!email) return { status: 'no-email' };

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    await prisma.registration.update({
      where: { id: registration.id },
      data: { userId: existing.id },
    });
    return { status: 'linked', userId: existing.id };
  }

  // Fall back to the visitor tier rather than refusing: an old registration
  // carrying a category this platform no longer offers is still a real person,
  // and the tier can be changed from their account page afterwards.
  const category = CATEGORIES.some((c) => c.id === registration.category)
    ? registration.category
    : 'visitor';

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  for (let attempt = 0; attempt < 5; attempt++) {
    // Reuse the code already printed on this registration when it has one, so
    // a badge issued from it earlier keeps working.
    const confirmationCode = registration.confirmationCode ?? generateConfirmationCode();

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: registration.fullName,
          role: 'ATTENDEE',
          category,
          phone: registration.phone,
          country: registration.country,
          organization: registration.organization,
          track: registration.track,
          confirmationCode,
        },
        select: { id: true },
      });

      // Linked in the same breath: an account created here but left unattached
      // leaves the registration still listed as needing one.
      await prisma.registration.update({
        where: { id: registration.id },
        data: { userId: user.id, confirmationCode },
      });

      return { status: 'created', userId: user.id, email, password };
    } catch (err) {
      // A code clash is a dice roll — draw again. Anything else is real.
      if (isCodeCollision(err) && !registration.confirmationCode) continue;
      if ((err as { code?: string }).code === 'P2002') return { status: 'failed' };
      throw err;
    }
  }

  return { status: 'failed' };
}
