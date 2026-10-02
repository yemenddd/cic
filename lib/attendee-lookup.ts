import { prisma } from '@/lib/db/client';
import { normalizePhone } from '@/lib/digits';

/**
 * Finding somebody at the door who has nothing to scan.
 *
 * The case this exists for is not rare, it was the majority: of 199 people
 * counted on the first day, 136 were registered at the desk itself. They have
 * an account and a confirmation code, but they were never emailed anything and
 * were never handed a printed badge — so on the second day they arrive with
 * nothing to present and no code to type, and the scanner has no way to reach
 * them.
 *
 * Without this the desk's only remaining move is to add them as a walk-in
 * again, which creates a second account for a person who already has one and
 * counts them twice in every figure the conference reports.
 *
 * Deliberately NOT a 'use server' module: every export of one is a public
 * endpoint, and a name-and-phone search over the attendee list is exactly the
 * kind of thing that must not be. The guarded caller lives in the panel's
 * actions.ts.
 */

export interface AttendeeMatch {
  id: string;
  name: string | null;
  phone: string | null;
  organization: string | null;
  category: string | null;
  confirmationCode: string | null;
  /** Registered at the desk rather than through the form — they have no badge. */
  walkIn: boolean;
  /** Already counted at the checkpoint being asked about. */
  alreadyHere: boolean;
  /** Admitted, so the door may count them; anything else goes to the desk. */
  admitted: boolean;
}

/** Enough to be a search, short enough not to list the whole conference. */
const MIN_QUERY = 2;
const LIMIT = 12;

export async function findAttendees(
  rawQuery: string,
  checkpointId: string | null,
): Promise<AttendeeMatch[]> {
  const query = rawQuery.trim();
  if (query.length < MIN_QUERY) return [];

  // A phone typed on an Arabic keyboard arrives as ٧٧٠…, which is the same
  // number and would match nothing stored. The same normalisation the
  // registration form applies is applied to the search.
  const digits = normalizePhone(query);

  const rows = await prisma.user.findMany({
    where: {
      role: 'ATTENDEE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        ...(digits ? [{ phone: { contains: digits } }] : []),
        { confirmationCode: { contains: query.toUpperCase() } },
        { organization: { contains: query, mode: 'insensitive' } },
      ],
    },
    // The people most likely to be standing there are the ones who registered
    // most recently at this same desk.
    orderBy: { createdAt: 'desc' },
    take: LIMIT,
    select: {
      id: true, name: true, phone: true, organization: true, category: true,
      confirmationCode: true, walkIn: true, status: true,
      ...(checkpointId
        ? { attendance: { where: { checkpointId }, select: { id: true }, take: 1 } }
        : {}),
    },
  });

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    organization: u.organization,
    category: u.category,
    confirmationCode: u.confirmationCode,
    walkIn: u.walkIn,
    // Shown before the tap, not after: "already counted" is the answer the
    // desk needs while the person is still in front of them.
    alreadyHere: Boolean((u as { attendance?: unknown[] }).attendance?.length),
    admitted: u.status === 'APPROVED',
  }));
}
