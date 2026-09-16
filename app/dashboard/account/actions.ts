'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

type ActionResult = { error?: string; success?: string } | void;

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  // The account is identified by the session, never by a hidden field in the
  // form — otherwise an attendee could edit another attendee's profile.
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى' };

  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const country = String(formData.get('country') || '').trim();
  const organization = String(formData.get('organization') || '').trim();

  if (!name) return { error: 'الاسم مطلوب' };

  // Email, category and track are deliberately NOT updatable here: the email is
  // the login identity and the category/track were set at registration.
  await prisma.user.update({
    where: { email },
    data: {
      name,
      phone: phone || null,
      country: country || null,
      organization: organization || null,
    },
  });

  revalidatePath('/dashboard/account');
  revalidatePath('/dashboard');

  return { success: 'تم حفظ بياناتك بنجاح' };
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى' };

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
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });

  return { success: 'تم تغيير كلمة المرور بنجاح' };
}
