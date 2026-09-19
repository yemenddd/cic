'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { isDayKey, type CheckInOutcome } from '@/lib/attendance';
import { recordAttendance } from '@/lib/attendance-record';

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
