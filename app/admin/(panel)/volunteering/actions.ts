'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';
import { minutesOfDay } from '@/lib/volunteering';
import { canonicalCommittee } from '@/lib/committees';

type ActionResult = { error?: string; success?: string } | void;

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';
const NOT_FOUND = 'الفترة غير موجودة';

function revalidate() {
  revalidatePath('/admin/volunteering');
  revalidatePath('/dashboard/volunteering');
  revalidatePath('/dashboard');
}

function readFields(formData: FormData) {
  return {
    titleAr: String(formData.get('titleAr') || '').trim(),
    committee: String(formData.get('committee') || '').trim(),
    day: String(formData.get('day') || '').trim(),
    startTime: String(formData.get('startTime') || '').trim(),
    endTime: String(formData.get('endTime') || '').trim(),
    location: String(formData.get('location') || '').trim(),
    notesAr: String(formData.get('notesAr') || '').trim(),
    capacity: Number(formData.get('capacity') || 1),
    isOpen: formData.get('isOpen') === 'on',
  };
}

/**
 * What is wrong with this shift, in the organizer's terms.
 *
 * The hours are checked rather than merely stored: a shift that ends before it
 * begins silently drops out of the clash detection and out of the hours a
 * volunteering certificate will state, so the moment to catch it is here,
 * where somebody can still fix the typo.
 */
function validate(f: ReturnType<typeof readFields>): string | null {
  if (!f.titleAr) return 'عنوان الفترة مطلوب';
  if (!canonicalCommittee(f.committee)) return 'اللجنة مطلوبة — اخترها من القائمة';
  if (!f.day) return 'اليوم مطلوب';

  const start = minutesOfDay(f.startTime);
  const end = minutesOfDay(f.endTime);
  if (start === null) return 'وقت البداية غير صالح — اكتبه بصيغة 09:00';
  if (end === null) return 'وقت النهاية غير صالح — اكتبه بصيغة 13:00';
  if (end <= start) return 'وقت النهاية يجب أن يكون بعد وقت البداية';

  if (!Number.isInteger(f.capacity) || f.capacity < 1 || f.capacity > 200) {
    return 'عدد المتطوعين المطلوب يجب أن يكون بين 1 و 200';
  }

  return null;
}

export async function createShift(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const f = readFields(formData);
  const problem = validate(f);
  if (problem) return { error: problem };

  const count = await prisma.volunteerShift.count({ where: { day: f.day } });
  await prisma.volunteerShift.create({
    data: {
      titleAr: f.titleAr,
      committee: canonicalCommittee(f.committee)!,
      day: f.day,
      startTime: f.startTime,
      endTime: f.endTime,
      location: f.location || null,
      notesAr: f.notesAr || null,
      capacity: f.capacity,
      isOpen: f.isOpen,
      order: count,
    },
  });

  revalidate();
  redirect('/admin/volunteering');
}

export async function updateShift(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const f = readFields(formData);
  const problem = validate(f);
  if (problem) return { error: problem };

  const existing = await prisma.volunteerShift.findUnique({
    where: { id },
    select: { _count: { select: { assignments: true } } },
  });
  if (!existing) return { error: NOT_FOUND };

  // Cutting the capacity below the number of people already on the shift would
  // leave it over-subscribed with no way for the rota to say so — and the
  // volunteers it pushed past the line would never be told. Refused here, with
  // the number that makes it refusable.
  if (f.capacity < existing._count.assignments) {
    // Worded around the count rather than through it: "2 مسجّلين" is the wrong
    // form (the dual is مسجّلان), and a sentence that states the number after a
    // noun phrase stays right for every value.
    return {
      error: `لا يمكن خفض العدد إلى ${f.capacity} بينما عدد المسجّلين ${existing._count.assignments} — ألغِ تسجيل أحدهم أولاً`,
    };
  }

  await prisma.volunteerShift.update({
    where: { id },
    data: {
      titleAr: f.titleAr,
      committee: canonicalCommittee(f.committee)!,
      day: f.day,
      startTime: f.startTime,
      endTime: f.endTime,
      location: f.location || null,
      notesAr: f.notesAr || null,
      capacity: f.capacity,
      isOpen: f.isOpen,
    },
  });

  revalidate();
  redirect('/admin/volunteering');
}

export async function deleteShift(id: string): Promise<void> {
  await assertAdmin();

  // The assignments go with it (onDelete: Cascade), which is why the list
  // shows how many people are on a shift before the delete button.
  await prisma.volunteerShift.delete({ where: { id } });

  revalidate();
}

/** Open or close a shift to new claims, without touching who is already on it. */
export async function toggleShiftOpen(id: string, open: boolean): Promise<void> {
  await assertAdmin();
  await prisma.volunteerShift.update({ where: { id }, data: { isOpen: open } });
  revalidate();
}

/** Take one volunteer off one shift — the organizer's counterpart to release. */
export async function removeAssignment(shiftId: string, userId: string): Promise<void> {
  await assertAdmin();
  await prisma.volunteerAssignment.deleteMany({ where: { shiftId, userId } });
  revalidate();
}
