'use server';

import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

type ActionResult = { error?: string; success?: string };
// resetUserPassword is the one action that hands something back: the generated
// password only ever exists in this response, never in the database.
type ResetResult = ActionResult & { password?: string };

// A Server Action is a POST to whatever route it shipped with — proxy.ts
// guards the /admin pages, but the action itself is the security boundary and
// must re-check the role on every call. Returns the session so the callers
// that need the acting admin's own id (deleteUser) can use it.
async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === 'ADMIN' ? session : null;
}

// Demoting or deleting the only ADMIN would leave the platform with nobody
// able to sign in to /admin, and no in-app way back — there is no self-serve
// promotion path. Every such call is refused before it reaches the database.
async function isLastAdmin(userId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (target?.role !== 'ADMIN') return false;
  return (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1;
}

// No 0/O/1/l/I — the admin reads this password out loud or pastes it into a
// message, and an ambiguous glyph turns into a support ticket.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const PASSWORD_LENGTH = 16;

function generatePassword(): string {
  const size = PASSWORD_ALPHABET.length;
  // 256 is not a multiple of the alphabet size, so bytes at or above the
  // cutoff are discarded rather than folded in with `%` — otherwise the first
  // few characters of the alphabet would come up measurably more often.
  const cutoff = Math.floor(256 / size) * size;

  let password = '';
  while (password.length < PASSWORD_LENGTH) {
    for (const byte of randomBytes(PASSWORD_LENGTH)) {
      if (byte >= cutoff) continue;
      password += PASSWORD_ALPHABET[byte % size];
      if (password.length === PASSWORD_LENGTH) break;
    }
  }
  return password;
}

export async function resetUserPassword(userId: string): Promise<ResetResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { error: 'المستخدم غير موجود' };

  const password = generatePassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });

  revalidatePath(`/admin/users/${userId}`);

  // The plaintext is returned exactly once. It is not stored anywhere, so if
  // the admin loses it the only way forward is another reset.
  return { success: 'تم إنشاء كلمة مرور جديدة', password };
}

export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  if (role !== 'ADMIN' && role !== 'ATTENDEE') return { error: 'الصلاحية غير صالحة' };

  if (role === 'ATTENDEE' && (await isLastAdmin(userId))) {
    return { error: 'لا يمكن تنزيل آخر مدير في المنصة — عيّن مديراً آخر أولاً' };
  }

  const { count } = await prisma.user.updateMany({ where: { id: userId }, data: { role } });
  if (count === 0) return { error: 'المستخدم غير موجود' };

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);

  return { success: role === 'ADMIN' ? 'تمت ترقية المستخدم إلى مدير' : 'تم تحويل المستخدم إلى مشارك' };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: 'غير مصرح لك بإدارة المستخدمين' };

  if (session.user?.id === userId) {
    return { error: 'لا يمكنك حذف حسابك الحالي وأنت مسجّل الدخول به' };
  }

  if (await isLastAdmin(userId)) {
    return { error: 'لا يمكن حذف آخر مدير في المنصة — عيّن مديراً آخر أولاً' };
  }

  const { count } = await prisma.user.deleteMany({ where: { id: userId } });
  if (count === 0) return { error: 'المستخدم غير موجود' };

  revalidatePath('/admin/users');
  redirect('/admin/users');
}
