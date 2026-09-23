import type { AccountStatus, AttendanceMethod, UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { verifyBadgeToken, isBadgeTokenShape } from '@/lib/badge-token';
import {
  dayLabel,
  defaultCheckpoints,
  type CheckInOutcome,
  type ScannedAttendee,
} from '@/lib/attendance';

/**
 * What taking attendance actually does, with no notion of who is asking.
 *
 * Deliberately NOT a 'use server' module: every export of one is a callable
 * endpoint, so an unguarded core living there would let anyone on the internet
 * mark the conference full. The actions in the admin panel prove they are
 * admins and then call this — the same split as announcements/send.ts.
 *
 * It is also the half that must never reach the browser: it reads the
 * badge-signing secret and talks to Postgres. That is why the shared
 * vocabulary lives in lib/attendance.ts instead — a Client Component needing
 * a label imports that and cannot pull this in by accident. (Reaching for
 * this file from a client bundle fails the build on `node:crypto`, which is
 * a backstop, not a design.)
 */

// ─── reading a scan ──────────────────────────────────────────────────────────

/**
 * What a scanner handed us.
 *
 * `token` is a badge issued by this platform — proof, because it is signed.
 * `code` is a confirmation code somebody read off a badge and typed, which
 * identifies an attendee but proves nothing; the two are kept apart so the
 * caller can decide how much to trust each.
 */
export type ScanInput =
  | { kind: 'token'; userId: string }
  | { kind: 'code'; code: string }
  | { kind: 'unreadable' };

/** Confirmation codes as issued by app/api/register/route.ts. */
const CODE_PATTERN = /^CIC-2026-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

/**
 * Turn whatever came out of the camera (or the manual-entry box) into one of
 * the three things it can be.
 *
 * Tolerant on the way in — trimmed, uppercased, and stripped of a surrounding
 * URL — because a phone camera app that resolves a QR to a link, or an
 * organizer typing a code in lowercase, are both the right badge presented
 * slightly wrong. Strict on the way out: anything that is not recognisably one
 * of ours is `unreadable` rather than a lookup on arbitrary input.
 */
export function parseScanInput(raw: string): ScanInput {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'unreadable' };

  // A QR read by a generic camera app may arrive as a URL wrapping the payload.
  const tail = trimmed.split(/[/?#]/).filter(Boolean).pop() ?? trimmed;
  const candidate = isBadgeTokenShape(tail) ? tail : trimmed;

  if (isBadgeTokenShape(candidate)) {
    const userId = verifyBadgeToken(candidate);
    // Shaped like one of ours but not signed by us: forged, or from another
    // deployment. Not a lookup — there is nothing honest to look up.
    return userId ? { kind: 'token', userId } : { kind: 'unreadable' };
  }

  const code = trimmed.toUpperCase().replace(/\s+/g, '');
  if (CODE_PATTERN.test(code)) return { kind: 'code', code };

  return { kind: 'unreadable' };
}

// ─── recording it ────────────────────────────────────────────────────────────

const ATTENDEE_FIELDS = {
  id: true,
  name: true,
  email: true,
  category: true,
  organization: true,
  confirmationCode: true,
} as const;

/** The same fields plus what decides whether they may come in at all. */
const SCAN_FIELDS = { ...ATTENDEE_FIELDS, status: true, role: true } as const;

type ScannedRow = ScannedAttendee & { status: AccountStatus; role: UserRole };

async function findAttendee(input: ScanInput): Promise<ScannedRow | null> {
  if (input.kind === 'unreadable') return null;

  if (input.kind === 'token') {
    return prisma.user.findUnique({ where: { id: input.userId }, select: SCAN_FIELDS });
  }

  return prisma.user.findUnique({
    where: { confirmationCode: input.code },
    select: SCAN_FIELDS,
  });
}

/**
 * Count one person at one checkpoint.
 *
 * `raw` is whatever the scanner read; pass `userId` instead when the organizer
 * picked a person from a list rather than scanning them.
 */
export async function recordAttendance(params: {
  checkpointId: string;
  raw?: string;
  userId?: string;
  method: AttendanceMethod;
  recordedById: string | null;
}): Promise<CheckInOutcome> {
  const { checkpointId, raw, userId, method, recordedById } = params;

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: checkpointId },
    select: { id: true, nameAr: true, isOpen: true, day: true },
  });
  if (!checkpoint) return { status: 'no-checkpoint' };
  if (!checkpoint.isOpen) return { status: 'closed', checkpointName: checkpoint.nameAr };

  const input: ScanInput = userId ? { kind: 'token', userId } : parseScanInput(raw ?? '');
  if (input.kind === 'unreadable') return { status: 'unreadable' };

  const row = await findAttendee(input);
  if (!row) return { status: 'unknown' };

  // The door is where "registered" and "admitted" finally have to be told
  // apart. A badge is issued at signup and is a bearer object — anybody
  // holding it can present it — so the scanner asks the database whether this
  // account was ever let in, rather than trusting that a valid signature
  // implies a valid attendee.
  //
  // An organizer is exempt for the same reason they are at sign-in: the role
  // is itself the admission.
  // Rebuilt field by field rather than spread-minus-two: `status` and `role`
  // were selected for the decision above and have no business travelling on to
  // a screen held up at a door. The same reasoning as lib/auth-guards.ts.
  const attendee: ScannedAttendee = {
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category,
    organization: row.organization,
    confirmationCode: row.confirmationCode,
  };

  if (row.role !== 'ADMIN' && row.status !== 'APPROVED') {
    return { status: 'not-admitted', attendee, accountStatus: row.status as 'PENDING' | 'REJECTED' };
  }

  const existing = await prisma.attendance.findUnique({
    where: { userId_checkpointId: { userId: attendee.id, checkpointId } },
    select: { checkedInAt: true, method: true },
  });
  if (existing) {
    return { status: 'duplicate', attendee, at: existing.checkedInAt, method: existing.method };
  }

  try {
    const created = await prisma.attendance.create({
      data: { userId: attendee.id, checkpointId, method, recordedById },
      select: { checkedInAt: true },
    });

    // The attendee finds out their arrival was registered without having to
    // ask anyone — which is the difference between a record and a receipt.
    await prisma.notification.create({
      data: {
        userId: attendee.id,
        title: `تم تسجيل حضورك · ${checkpoint.nameAr}`,
        body: `سُجّل حضورك في ${dayLabel(checkpoint.day)} عند «${checkpoint.nameAr}».`,
        link: '/dashboard/badge',
      },
    });

    return { status: 'recorded', attendee, at: created.checkedInAt, method };
  } catch (err) {
    // P2002: a second scan of the same badge got there first — the unique pair
    // (userId, checkpointId) is what makes this safe to point at a moving
    // queue. Checking first and then inserting would let two scans a few
    // milliseconds apart both pass the check, which is exactly what a hesitant
    // hand on a scanner produces.
    if ((err as { code?: string }).code === 'P2002') {
      const row = await prisma.attendance.findUnique({
        where: { userId_checkpointId: { userId: attendee.id, checkpointId } },
        select: { checkedInAt: true, method: true },
      });
      return {
        status: 'duplicate',
        attendee,
        at: row?.checkedInAt ?? new Date(),
        method: row?.method ?? method,
      };
    }
    throw err;
  }
}

/**
 * Creates the default gates once, and only when nothing exists yet.
 *
 * Two layers, because this runs on page render and pages render concurrently:
 * the count stops the gates being resurrected after an organizer has replaced
 * them with their own, and `skipDuplicates` over the fixed ids in
 * defaultCheckpoints() stops two simultaneous first-loads from both inserting.
 */
export async function ensureDefaultCheckpoints(): Promise<void> {
  if ((await prisma.checkpoint.count()) > 0) return;
  await prisma.checkpoint.createMany({ data: defaultCheckpoints(), skipDuplicates: true });
}
