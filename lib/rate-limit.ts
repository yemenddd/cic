import { prisma } from '@/lib/db/client';

/**
 * Slows down repeated failed sign-ins and bulk registration attempts.
 *
 * Why this is needed: the sign-in endpoint is public, and the organizers'
 * admin address is printed in the site footer — so the attacker's half of the
 * credential pair is already known. Without a limit, the only thing standing
 * between a guesser and the panel is how fast they can send requests.
 *
 * Why it is stored in Postgres and not in a module-level Map: each request may
 * run in a different serverless instance, so an in-process counter would be
 * shared with nobody and wiped by the next cold start. One indexed upsert per
 * failed attempt is a fair price for a counter that actually counts.
 */

export interface ThrottleRule {
  /** Failures allowed inside the window before the key is locked. */
  limit: number;
  /** How long failures keep accumulating, in seconds. */
  windowSeconds: number;
  /** Ceiling on a single lock, in seconds. */
  maxLockSeconds: number;
}

/**
 * Per-account guessing. Capped at 15 minutes on purpose: a longer lock turns
 * into a denial-of-service against the real owner, since anyone who knows an
 * email can trigger it. Fifteen minutes still cuts an attacker from thousands
 * of guesses an hour down to about twenty.
 */
export const LOGIN_BY_EMAIL: ThrottleRule = { limit: 5, windowSeconds: 900, maxLockSeconds: 900 };

/** Spraying one password across many accounts — same source, many emails. */
export const LOGIN_BY_IP: ThrottleRule = { limit: 20, windowSeconds: 900, maxLockSeconds: 1800 };

/**
 * Registrations that were *rejected* — bad data, a duplicate address, a
 * category that is not on the list. Several of these in a row is somebody
 * probing the endpoint rather than somebody signing up.
 *
 * Strict, because a rejected request is cheap to make and means nothing good.
 */
export const REGISTER_REJECTED_BY_IP: ThrottleRule = {
  limit: 8, windowSeconds: 3600, maxLockSeconds: 1800,
};

/**
 * Registrations that succeeded.
 *
 * Generous on purpose, and this is the correction of a real fault: the old
 * rule counted every attempt against a limit of five an hour, successes
 * included. A conference registration desk, a university, an office and a
 * family all reach this site from one address, so the sixth person to sign up
 * from any of them was refused for an hour — and a single visitor fumbling
 * the form burnt the allowance for everyone behind the same router.
 *
 * Thirty an hour is more than a desk will do and slow enough that a script
 * filling the attendee list is not worth writing.
 */
export const REGISTER_BY_IP: ThrottleRule = {
  limit: 30, windowSeconds: 3600, maxLockSeconds: 1800,
};

/**
 * Password-reset requests. Counts every attempt, not just failures — there is
 * no such thing as a failed one from the caller's point of view, since the
 * form deliberately answers the same way for an unknown address.
 *
 * Tight, because each accepted request sends real mail to somebody who did not
 * ask for it. Three a quarter-hour is generous for a person who mistyped their
 * address and far below what it takes to use the form to harass an inbox.
 */
export const RESET_BY_IP: ThrottleRule = { limit: 3, windowSeconds: 900, maxLockSeconds: 1800 };

/**
 * And per address, so one target cannot be flooded from many sources.
 * Deliberately keyed on the address typed in, not on an account — the whole
 * point is that we do not reveal whether one exists.
 */
export const RESET_BY_EMAIL: ThrottleRule = { limit: 3, windowSeconds: 900, maxLockSeconds: 1800 };

/**
 * How long to lock after `failures` failures. Doubles each extra failure past
 * the limit, so an honest typo costs a minute while a script hits the ceiling
 * almost immediately.
 *
 * Pure on purpose — the backoff curve is the part worth reasoning about, and
 * it can be checked without a database.
 */
export function lockSeconds(failures: number, rule: ThrottleRule): number {
  if (failures < rule.limit) return 0;
  const doublings = failures - rule.limit;
  // Cap the exponent before computing it: 2 ** 1000 is Infinity, and
  // Infinity * 60 stays Infinity rather than clamping to the ceiling.
  const capped = Math.min(doublings, 20);
  return Math.min(60 * 2 ** capped, rule.maxLockSeconds);
}

export interface ThrottleState {
  blocked: boolean;
  /** Seconds until the next attempt is allowed. 0 when not blocked. */
  retryAfter: number;
}

const ALLOWED: ThrottleState = { blocked: false, retryAfter: 0 };

function secondsUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
}

/** Is this key currently locked? Does not count as an attempt. */
export async function throttleState(scope: string, key: string): Promise<ThrottleState> {
  if (!key) return ALLOWED;

  const row = await prisma.authThrottle.findUnique({
    where: { scope_key: { scope, key } },
    select: { lockedUntil: true },
  });

  if (!row?.lockedUntil) return ALLOWED;
  const retryAfter = secondsUntil(row.lockedUntil);
  return retryAfter > 0 ? { blocked: true, retryAfter } : ALLOWED;
}

/**
 * Count one failed attempt and lock the key if it has now had too many.
 * Returns the resulting state so the caller can report the wait.
 */
export async function recordFailure(
  scope: string,
  key: string,
  rule: ThrottleRule,
): Promise<ThrottleState> {
  if (!key) return ALLOWED;

  const now = new Date();
  const existing = await prisma.authThrottle.findUnique({ where: { scope_key: { scope, key } } });

  // A window that has run out starts over rather than holding a grudge: five
  // failures spread across a month are somebody forgetting their password,
  // not an attack.
  const windowExpired =
    !existing || now.getTime() - existing.windowStart.getTime() > rule.windowSeconds * 1000;

  const failures = windowExpired ? 1 : existing.failures + 1;
  const lock = lockSeconds(failures, rule);
  const lockedUntil = lock > 0 ? new Date(now.getTime() + lock * 1000) : null;

  await prisma.authThrottle.upsert({
    where: { scope_key: { scope, key } },
    create: { scope, key, failures, windowStart: now, lockedUntil },
    update: { failures, windowStart: windowExpired ? now : existing.windowStart, lockedUntil },
  });

  // Two simultaneous failures can race and record the same count, letting one
  // extra attempt through. That is acceptable: the limit is a speed bump
  // measured in dozens, and a transaction per failed password is not worth it.

  return lock > 0 ? { blocked: true, retryAfter: lock } : ALLOWED;
}

/** Wipe the counter — called after a successful sign-in. */
export async function clearFailures(scope: string, key: string): Promise<void> {
  if (!key) return;
  await prisma.authThrottle.deleteMany({ where: { scope, key } });
}

/**
 * The client's address, or null when it cannot be determined.
 *
 * Null means the IP-keyed limits are skipped rather than lumping every
 * anonymous caller into one shared bucket — that bucket would be filled by the
 * first attacker and would then lock out everybody else. Vercel always sets
 * `x-forwarded-for`, so in production this is null only for local runs.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  // The header is a chain: the left-most entry is the original client.
  const first = forwarded?.split(',')[0]?.trim();
  return first || headers.get('x-real-ip')?.trim() || null;
}

/**
 * Drop counters nobody has touched in a day. Called opportunistically so the
 * table cannot grow forever under a distributed attack, without adding a cron
 * job for a handful of rows.
 */
export async function pruneThrottles(): Promise<void> {
  if (Math.random() > 0.02) return;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    await prisma.authThrottle.deleteMany({ where: { updatedAt: { lt: cutoff } } });
  } catch {
    // Housekeeping must never turn into a failed sign-in.
  }
}
