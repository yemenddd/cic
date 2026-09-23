'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { isDayKey, type CheckInOutcome } from '@/lib/attendance';
import { recordAttendance } from '@/lib/attendance-record';
import { generateConfirmationCode, isCodeCollision } from '@/lib/confirmation-code';
import { validateWalkIn, walkInEmail, walkInFields, type WalkInInput } from '@/lib/walk-in';
import { randomUUID } from 'node:crypto';

type ActionResult = { error?: string; success?: string };

// Every export of a 'use server' module is a public POST endpoint. The panel
// layout guards the /admin *pages*, but not these — so each one re-checks the
// caller against the database (see lib/auth-guards.ts), and the domain logic
// they call knows nothing about who is asking.

function revalidateAttendance() {
  revalidatePath('/admin/attendance');
  revalidatePath('/admin/attendance/checkpoints');
  revalidatePath('/admin');
}

/**
 * One scan.
 *
 * Returns the outcome rather than throwing on a bad badge: at a door, "this
 * code is not one of ours" is a normal event that the person holding the
 * scanner must see and act on, not an error page.
 */
export async function scanBadge(checkpointId: string, raw: string): Promise<CheckInOutcome> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'unreadable' };

  const outcome = await recordAttendance({
    checkpointId,
    raw,
    method: 'QR',
    recordedById: admin.id,
  });

  // Only a new row changes any of the figures. Revalidating on a duplicate
  // would rebuild the dashboard for every double-scan in a moving queue.
  if (outcome.status === 'recorded') revalidateAttendance();

  return outcome;
}

/**
 * Check somebody in without scanning them.
 *
 * The badge is on a phone that is out of battery, or was never printed. The
 * row records MANUAL so the attendance list stays honest about which entries
 * are evidence and which are somebody's word.
 */
export async function manualCheckIn(checkpointId: string, userId: string): Promise<CheckInOutcome> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'unreadable' };

  const outcome = await recordAttendance({
    checkpointId,
    userId,
    method: 'MANUAL',
    recordedById: admin.id,
  });

  if (outcome.status === 'recorded') {
    revalidateAttendance();
    revalidatePath(`/admin/users/${userId}`);
  }

  return outcome;
}

/**
 * Admit somebody who never registered.
 *
 * The case this exists for: a person is standing at the desk, has no account,
 * cannot make one (no phone, no signal, no patience for a form with a password
 * on it), and is about to walk into the conference either way. Before this,
 * the honest options were to turn them away or to let them in uncounted — and
 * an uncounted attendee is a hole in every number the conference reports
 * afterwards.
 *
 * Creating the account and counting the attendance are one transaction: a row
 * that exists but was never checked in would look, forever after, like
 * somebody who registered and did not come.
 */
export async function addWalkIn(
  _prev: ActionResult | undefined,
  form: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: 'غير مصرح لك بإدارة الحضور' };

  const checkpointId = String(form.get('checkpointId') ?? '').trim();
  const input: WalkInInput = {
    name: String(form.get('name') ?? ''),
    phone: String(form.get('phone') ?? ''),
    category: String(form.get('category') ?? 'visitor'),
    organization: String(form.get('organization') ?? ''),
    country: String(form.get('country') ?? ''),
  };

  const problem = validateWalkIn(input);
  if (problem) return { error: problem };

  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: checkpointId },
    select: { id: true, nameAr: true, isOpen: true },
  });
  if (!checkpoint) return { error: 'اختر نقطة الحضور أولاً' };
  if (!checkpoint.isOpen) return { error: `نقطة «${checkpoint.nameAr}» مغلقة` };

  const fields = walkInFields(input);

  // No password can ever match this: bcrypt refuses to verify against a string
  // that is not a valid hash, so the account is unusable by design rather than
  // by a flag somebody could forget to check. They were admitted in person;
  // they were never given a way in from outside.
  const passwordHash = `walk-in:${randomUUID()}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const confirmationCode = generateConfirmationCode();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            ...fields,
            email: walkInEmail(confirmationCode),
            passwordHash,
            role: 'ATTENDEE',
            // An organizer standing in front of them is the approval.
            status: 'APPROVED',
            statusChangedAt: new Date(),
            walkIn: true,
            confirmationCode,
            // The same pairing every other signup makes, so the registrations
            // list and the CSV the organizers actually count from are not
            // missing the people who came through the door.
            registrations: {
              create: {
                fullName: fields.name,
                email: walkInEmail(confirmationCode),
                phone: fields.phone,
                country: fields.country,
                organization: fields.organization,
                category: fields.category,
                confirmationCode,
              },
            },
          },
          select: { id: true, name: true },
        });

        await tx.attendance.create({
          data: {
            userId: user.id,
            checkpointId: checkpoint.id,
            method: 'MANUAL',
            recordedById: admin.id,
          },
        });

        return user;
      });

      revalidateAttendance();
      revalidatePath('/admin/registrations');
      revalidatePath('/admin/users');

      return { success: `أُضيف ${created.name} وسُجّل حضوره عند «${checkpoint.nameAr}»` };
    } catch (err) {
      // A confirmation-code collision is a dice roll, not a failure — draw
      // again. Anything else is real and the desk needs to hear about it.
      if (isCodeCollision(err)) continue;

      console.error('Failed to add a walk-in attendee:', err);
      return { error: 'تعذّر إضافة الحاضر، حاول مرة أخرى' };
    }
  }

  return { error: 'تعذّر إصدار رمز تأكيد، حاول مرة أخرى' };
}

/**
 * Remove one attendance row.
 *
 * Needed because the alternative to an undo is a permanent wrong number: a
 * scanner pointed at the wrong badge, or a queue where two people's passes
 * were held up together.
 */
export async function undoAttendance(attendanceId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة الحضور' };

  const row = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: { userId: true },
  });
  if (!row) return { error: 'السجل غير موجود' };

  await prisma.attendance.delete({ where: { id: attendanceId } });

  revalidateAttendance();
  revalidatePath(`/admin/users/${row.userId}`);

  return { success: 'تم حذف سجل الحضور' };
}

// ─── checkpoints ─────────────────────────────────────────────────────────────

export async function createCheckpoint(
  _prev: ActionResult | undefined,
  form: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة الحضور' };

  const nameAr = String(form.get('nameAr') ?? '').trim().slice(0, 120);
  const day = String(form.get('day') ?? '').trim();
  const sessionId = String(form.get('sessionId') ?? '').trim();

  if (!nameAr) return { error: 'اسم نقطة الحضور مطلوب' };
  if (!isDayKey(day)) return { error: 'اليوم غير صالح' };

  // A checkpoint tied to a session is a SESSION checkpoint; that is what the
  // link *means*, so the kind is derived rather than asked for twice and then
  // allowed to contradict itself.
  const session = sessionId
    ? await prisma.programSession.findUnique({ where: { id: sessionId }, select: { id: true } })
    : null;
  if (sessionId && !session) return { error: 'الجلسة المختارة غير موجودة' };

  const last = await prisma.checkpoint.findFirst({
    where: { day },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  await prisma.checkpoint.create({
    data: {
      nameAr,
      day,
      kind: session ? 'SESSION' : 'GATE',
      sessionId: session?.id ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateAttendance();
  return { success: 'تم إنشاء نقطة الحضور' };
}

/**
 * Open or close a checkpoint.
 *
 * A closed checkpoint refuses scans. The desk is staffed for an hour, and a
 * scanner left open on somebody's phone afterwards would keep counting people
 * into a room that emptied at noon.
 */
export async function setCheckpointOpen(checkpointId: string, isOpen: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة الحضور' };

  const { count } = await prisma.checkpoint.updateMany({
    where: { id: checkpointId },
    data: { isOpen },
  });
  if (count === 0) return { error: 'نقطة الحضور غير موجودة' };

  revalidateAttendance();
  return { success: isOpen ? 'تم فتح نقطة الحضور' : 'تم إغلاق نقطة الحضور' };
}

export async function renameCheckpoint(checkpointId: string, nameAr: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة الحضور' };

  const name = nameAr.trim().slice(0, 120);
  if (!name) return { error: 'اسم نقطة الحضور مطلوب' };

  const { count } = await prisma.checkpoint.updateMany({
    where: { id: checkpointId },
    data: { nameAr: name },
  });
  if (count === 0) return { error: 'نقطة الحضور غير موجودة' };

  revalidateAttendance();
  return { success: 'تم تغيير الاسم' };
}

/**
 * Delete a checkpoint — and, by cascade, everything counted at it.
 *
 * Refused once it holds attendance. Closing a checkpoint is what an organizer
 * who is finished with it actually wants; deleting one erases the record that
 * two hundred people walked through that door, and no confirm dialog makes
 * that recoverable.
 */
export async function deleteCheckpoint(checkpointId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة الحضور' };

  const attendance = await prisma.attendance.count({ where: { checkpointId } });
  if (attendance > 0) {
    return { error: `لا يمكن حذف نقطة سُجّل فيها ${attendance} حضوراً — أغلقها بدلاً من ذلك` };
  }

  const { count } = await prisma.checkpoint.deleteMany({ where: { id: checkpointId } });
  if (count === 0) return { error: 'نقطة الحضور غير موجودة' };

  revalidateAttendance();
  return { success: 'تم حذف نقطة الحضور' };
}
