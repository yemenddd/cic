import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The string a badge's QR code actually carries.
 *
 * Shape: `CIC1.<userId>.<signature>` — a version tag, the account it belongs
 * to, and an HMAC of the two over AUTH_SECRET.
 *
 * Why a signature rather than the bare user id, or the confirmation code that
 * is already printed on the badge:
 *
 *   - The id is a cuid, which is sequential enough that one real badge tells
 *     you roughly where the neighbouring ones are. Anybody who scanned a
 *     single attendee could then mint QR codes for people who never arrived,
 *     and the attendance figures — which decide who is handed a certificate —
 *     would be fiction.
 *   - The confirmation code is only ~10^9 wide and is read aloud at the desk,
 *     photographed, and forwarded in chat. It is an identifier, not a secret.
 *
 * An HMAC is unguessable without the server's secret, so a scan that verifies
 * is proof the badge was issued by this platform.
 *
 * Why nothing is stored: the token is a deterministic function of the user id,
 * so it can be recomputed at any time, never expires, and survives a reprint.
 * A badge is a physical object an attendee may have printed weeks earlier —
 * a rotating token would quietly stop working in their pocket. The cost is
 * that rotating AUTH_SECRET invalidates every printed badge at once; that is
 * the same blast radius as rotating it already has for every live session, so
 * it is not a new constraint.
 */

/** Version tag, so a future payload shape can be told apart from this one. */
const PREFIX = 'CIC1';

/**
 * The tag this used to carry, still accepted when verifying.
 *
 * The prefix is not decoration: it is fed into the HMAC, so renaming it
 * changes every signature. A badge is a physical object somebody may have
 * printed weeks earlier, and a rename that only emitted the new shape would
 * stop those scanning at the door with no way to tell why.
 *
 * Only ever verified, never issued. It can be deleted once no badge printed
 * before the rename can still turn up — which, for a two-day conference, is
 * after it has happened.
 */
const LEGACY_PREFIX = 'CICT1';

/**
 * 22 base64url characters ≈ 132 bits of the digest. Far past the point where
 * guessing is worth attempting, and short enough to keep the QR at a version
 * that scans from a phone held at arm's length.
 */
const SIGNATURE_LENGTH = 22;

/** Only the shapes above — anything else is not one of our badges. */
const TOKEN_PATTERN = new RegExp(
  `^(${PREFIX}|${LEGACY_PREFIX})\\.([A-Za-z0-9_-]{1,64})\\.([A-Za-z0-9_-]{${SIGNATURE_LENGTH}})$`,
);

function secret(): string {
  const value = process.env.AUTH_SECRET;
  // Failing loudly beats signing with a constant: a badge signed with an empty
  // secret is forgeable by anyone who reads this file.
  if (!value) throw new Error('AUTH_SECRET is required to sign badge tokens');
  return value;
}

function sign(userId: string, prefix: string = PREFIX): string {
  return createHmac('sha256', secret())
    .update(`${prefix}:${userId}`)
    .digest('base64url')
    .slice(0, SIGNATURE_LENGTH);
}

/** The QR payload for one account. Stable for the life of the account. */
export function badgeToken(userId: string): string {
  return `${PREFIX}.${userId}.${sign(userId)}`;
}

/**
 * The account a scanned token belongs to, or null if it was not issued here.
 *
 * The comparison is timing-safe. The margin is theoretical at conference
 * scale, but the alternative costs one line.
 */
export function verifyBadgeToken(raw: string): string | null {
  const match = TOKEN_PATTERN.exec(raw.trim());
  if (!match) return null;

  const [, prefix, userId, signature] = match;
  // Signed with whichever tag the token actually carries, so a badge printed
  // before the rename verifies against the secret that signed it.
  const expected = Buffer.from(sign(userId, prefix));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? userId : null;
}

export function isBadgeTokenShape(raw: string): boolean {
  return TOKEN_PATTERN.test(raw.trim());
}
