'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { canVolunteer, MAX_SHIFTS_PER_VOLUNTEER } from '@/lib/categories';
import { canClaim, REFUSAL_MESSAGES } from '@/lib/volunteering';

type ActionResult = { error?: string; success?: string };

const SESSION_EXPIRED = 'انتهت الجلسة، سجّل الدخول مرة أخرى';
const NOT_ENTITLED = 'جدول التطوّع متاح لفئة «متطوع» فقط';
const GONE = 'لم تعد هذه الفترة موجودة';
const BUSY = 'فترة مزدحمة الآن — حاول مرة أخرى';
const TOO_MANY = `لا يمكن حجز أكثر من ${MAX_SHIFTS_PER_VOLUNTEER} فترات — ألغِ فترة قبل حجز أخرى`;

// Signing up for a shift is a `volunteer` benefit (see lib/categories.ts).
// Hiding the nav link only tidies the UI — a server action is a public POST
// endpoint, so entitlement is re-checked here on every write. The category is
// read from the database rather than the JWT, so an organizer moving somebody
// out of the volunteer tier takes effect immediately instead of whenever their
// token happens to refresh.
async function entitledUserId(): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { error: SESSION_EXPIRED };

  const user = await prisma.user.findUnique({ where: { id }, select: { category: true } });
  if (!user) return { error: SESSION_EXPIRED };
  if (!canVolunteer(user.category)) return { error: NOT_ENTITLED };

  return { id };
}

function revalidate() {
  revalidatePath('/dashboard/volunteering');
  revalidatePath('/dashboard');
  revalidatePath('/admin/volunteering');
}

/**
 * Take a shift.
 *
 * The check and the write are one Serializable transaction. Two volunteers
 * tapping the last place at the same moment is not a hypothetical — the page
 * shows how many are left, so the last one is exactly the one everybody races
 * for — and read-then-write outside a transaction puts them both on it. Under
 * Serializable one of the two is refused by the database, and Postgres reports
 * that as P2034, which is a "try again" and not a fault.
 */
export async function claimShift(shiftId: string): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };
  const userId = me.id;

  try {
    const outcome = await prisma.$transaction(
      async (tx) => {
        const shift = await tx.volunteerShift.findUnique({
          where: { id: shiftId },
          select: {
            id: true, day: true, startTime: true, endTime: true,
            capacity: true, isOpen: true,
            _count: { select: { assignments: true } },
          },
        });
        if (!shift) return { error: GONE };

        // Their whole rota, because a clash is a fact about the day and not
        // about this shift: the title comes along so the refusal can name the
        // shift they already hold rather than saying "something clashes".
        const held = await tx.volunteerAssignment.findMany({
          where: { userId },
          select: { shift: { select: { id: true, titleAr: true, day: true, startTime: true, endTime: true } } },
        });
        const mine = held.map((h) => h.shift);

        if (mine.length >= MAX_SHIFTS_PER_VOLUNTEER) return { error: TOO_MANY };

        const verdict = canClaim(
          { ...shift, taken: shift._count.assignments },
          mine,
        );
        if (!verdict.ok) {
          const message = REFUSAL_MESSAGES[verdict.reason];
          return {
            error: verdict.reason === 'clash' && verdict.clashesWith
              ? `${message}: «${verdict.clashesWith}»`
              : message,
          };
        }

        await tx.volunteerAssignment.create({ data: { shiftId, userId } });
        return { success: 'تم تسجيلك في هذه الفترة' };
      },
      { isolationLevel: 'Serializable' },
    );

    if (outcome.success) revalidate();
    return outcome;
  } catch (err) {
    const code = (err as { code?: string }).code;

    // P2034 — the database refused one of two concurrent claims. P2002 — the
    // same volunteer claimed twice at once (two tabs, a double tap). Neither
    // is an error worth showing as one.
    if (code === 'P2034') return { error: BUSY };
    if (code === 'P2002') return { error: REFUSAL_MESSAGES.already };

    console.error('Failed to claim volunteer shift:', err);
    return { error: 'تعذّر تسجيلك في هذه الفترة، حاول مرة أخرى' };
  }
}

/**
 * Give a shift back.
 *
 * Scoped to both ids, so releasing somebody else's place matches zero rows
 * rather than taking them off the rota, and releasing one that is already gone
 * is a no-op rather than a crash.
 */
export async function releaseShift(shiftId: string): Promise<ActionResult> {
  const me = await entitledUserId();
  if ('error' in me) return { error: me.error };

  const { count } = await prisma.volunteerAssignment.deleteMany({
    where: { shiftId, userId: me.id },
  });

  revalidate();
  return count > 0
    ? { success: 'تم إلغاء تسجيلك في هذه الفترة' }
    : { error: 'لم تكن مسجّلاً في هذه الفترة' };
}
