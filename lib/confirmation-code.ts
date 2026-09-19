import { randomBytes } from 'node:crypto';

/**
 * The code printed on a badge.
 *
 * Shared by the public registration route and the admin panel's own
 * "create account" form, because a code minted at the registration desk has to
 * be indistinguishable from one minted on the website — same alphabet, same
 * length, same uniqueness guarantee. Two generators drift, and the one that
 * drifts is the one nobody looks at again.
 */

/** No 0/O/1/I — this code is read off a printed badge at the door. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * A random badge code.
 *
 * Random rather than derived from the attendee: an earlier version seeded a
 * hash with `Date.now()` and the name, so a family signing up together on one
 * laptop could be handed identical codes. The unique column on User is the
 * backstop; callers retry on the (vanishingly rare) collision.
 */
export function generateConfirmationCode(): string {
  const size = CODE_ALPHABET.length;
  // 32 divides 256 evenly, so `% size` is uniform with no bytes to discard.
  const code = Array.from(randomBytes(6), (b) => CODE_ALPHABET[b % size]).join('');
  return `CICT-2026-${code}`;
}

/** Did a unique-constraint failure come from the confirmation code column? */
export function isCodeCollision(err: unknown): boolean {
  const e = err as { code?: string; meta?: { target?: string[] } };
  return e?.code === 'P2002' && Boolean(e.meta?.target?.includes('confirmationCode'));
}
