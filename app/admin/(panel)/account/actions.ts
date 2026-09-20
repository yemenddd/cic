'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { currentUser } from '@/lib/auth-guards';

type ActionResult = { error?: string; success?: string } | void;

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  // Resolved from the database, so a token belonging to a deleted account
  // can't reach the update below. No role check: this only ever touches the
  // caller's own password, and it still has to prove the current one.
  const account = await currentUser();
  if (!account) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى' };
  const email = account.email;

  const current = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');
  const confirm = String(formData.get('confirm') || '');

  if (next.length < 10) return { error: 'كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل' };
  if (next !== confirm) return { error: 'كلمتا المرور غير متطابقتين' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'الحساب غير موجود' };

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { error: 'كلمة المرور الحالية غير صحيحة' };
  }

  await prisma.user.update({
    where: { email },
    // Stamped so the account's existing sessions stop working — see
    // lib/auth-guards.ts. An organiser resetting a compromised account must
    // not leave whoever compromised it signed in.
    data: { passwordHash: await bcrypt.hash(next, 12), passwordChangedAt: new Date() },
  });

  return { success: 'تم تغيير كلمة المرور بنجاح' };
}
