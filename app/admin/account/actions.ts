'use server';

import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

type ActionResult = { error?: string; success?: string } | void;

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى' };

  const current = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');
  const confirm = String(formData.get('confirm') || '');

  if (next.length < 10) return { error: 'كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل' };
  if (next !== confirm) return { error: 'كلمتا المرور غير متطابقتين' };

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return { error: 'الحساب غير موجود' };

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { error: 'كلمة المرور الحالية غير صحيحة' };
  }

  await prisma.adminUser.update({
    where: { email },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });

  return { success: 'تم تغيير كلمة المرور بنجاح' };
}
