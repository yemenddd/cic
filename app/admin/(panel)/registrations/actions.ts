'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { assertAdmin, requireAdmin } from '@/lib/auth-guards';
import {
  RECONCILE_MESSAGES,
  reconcileRegistrationAccount,
} from '@/lib/registration-accounts';

const UNAUTHORIZED = 'غير مصرح لك بهذا الإجراء';

type ActionResult = { error?: string; success?: string };

// A Server Action is a public POST endpoint whatever route it shipped with, so
// every one of these resolves the caller from the database before touching
// anything. See lib/auth-guards.ts.

function revalidateRegistrations(id?: string) {
  revalidatePath('/admin/registrations');
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/registrations/${id}`);
}

export async function deleteRegistration(id: string): Promise<void> {
  await assertAdmin();
  await prisma.registration.delete({ where: { id } });
  revalidateRegistrations();
}

export type ReconcileResult = ActionResult & {
  /** Set only when an account was created — it exists nowhere else. */
  password?: string;
  email?: string;
  userId?: string;
};

/**
 * Give a registration an account, or attach it to the one that already exists.
 *
 * This is the action the "بلا حساب" filter was pointing at and could not
 * perform: finding those people was possible, doing anything about them was
 * not. The decision itself lives in lib/registration-accounts.ts — this half
 * only proves who is asking.
 */
export async function createAccountForRegistration(
  registrationId: string,
): Promise<ReconcileResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const outcome = await reconcileRegistrationAccount(registrationId);
  const message = RECONCILE_MESSAGES[outcome.status];

  if (outcome.status === 'created') {
    revalidateRegistrations(registrationId);
    return {
      success: message,
      password: outcome.password,
      email: outcome.email,
      userId: outcome.userId,
    };
  }

  if (outcome.status === 'linked') {
    revalidateRegistrations(registrationId);
    return { success: message, userId: outcome.userId };
  }

  return { error: message };
}

const MAX_BULK = 500;

export async function bulkDeleteRegistrations(ids: string[]): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  // Deduplicated, bounded and shape-checked: a bulk action is the one place a
  // malformed list could touch hundreds of rows before anyone notices.
  const clean = [...new Set(ids)]
    .filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id))
    .slice(0, MAX_BULK);
  if (clean.length === 0) return { error: 'لم تحدد أي تسجيل' };

  const { count } = await prisma.registration.deleteMany({ where: { id: { in: clean } } });

  revalidateRegistrations();
  return { success: `تم حذف ${count} تسجيلاً` };
}

/** Delete from the detail page, which must not stay open on a deleted row. */
export async function deleteRegistrationAndReturn(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: UNAUTHORIZED };

  const { count } = await prisma.registration.deleteMany({ where: { id } });
  if (count === 0) return { error: 'التسجيل غير موجود' };

  revalidateRegistrations();
  redirect('/admin/registrations');
}
