'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { MIN_PASSWORD_LENGTH } from '@/lib/password-rules';
import { currentUser } from '@/lib/auth-guards';
import { isTrackAllowed } from '@/lib/submissions';
import { LOGIN_BY_EMAIL, clearFailures, recordFailure, throttleState } from '@/lib/rate-limit';

type ActionResult = { error?: string; success?: string } | void;

const SESSION_EXPIRED = 'انتهت الجلسة، سجّل الدخول مرة أخرى';

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  // The account is identified by the session, never by a hidden field in the
  // form — otherwise an attendee could edit another attendee's profile. Read
  // from the database so a token belonging to a deleted account gets a clean
  // message instead of a Prisma "record not found" crash on the update below.
  const account = await currentUser();
  if (!account) return { error: SESSION_EXPIRED };

  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const country = String(formData.get('country') || '').trim();
  const organization = String(formData.get('organization') || '').trim();
  const track = String(formData.get('track') || '').trim();

  if (!name) return { error: 'الاسم مطلوب' };
  if (name.length > 120) return { error: 'الاسم طويل جداً' };

  const existing = await prisma.user.findUnique({
    where: { id: account.id },
    select: { track: true },
  });
  if (!existing) return { error: SESSION_EXPIRED };

  // The track is printed on the certificate, so it is picked from the list the
  // registration form offers rather than typed. An attendee whose stored track
  // predates that list keeps it — the check allows their own current value so
  // editing anything else on the page can't silently rewrite it.
  if (!isTrackAllowed(track, existing.track)) return { error: 'المسار المحدد غير صالح' };

  await prisma.user.update({
    where: { id: account.id },
    data: {
      name,
      phone: phone || null,
      country: country || null,
      organization: organization || null,
      track: track || null,
    },
  });

  revalidatePath('/dashboard/account');
  revalidatePath('/dashboard');
  // The certificate prints the name and track, so its preview must not keep
  // showing the old ones.
  revalidatePath('/dashboard/certificate');
  revalidatePath('/dashboard/badge');

  return { success: 'تم حفظ بياناتك بنجاح' };
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const account = await currentUser();
  if (!account) return { error: SESSION_EXPIRED };

  // The sign-in throttle does not cover this endpoint, and this one also takes
  // the *current* password — so without a limit it is a way to guess it at full
  // speed from a session someone walked away from, and a way to spend a bcrypt
  // hash per request. Keyed by account, like the sign-in limit.
  const scope = 'password-change';
  const blocked = await throttleState(scope, account.id);
  if (blocked.blocked) {
    const minutes = Math.max(1, Math.ceil(blocked.retryAfter / 60));
    return { error: `محاولات كثيرة — حاول مرة أخرى بعد ${minutes} دقيقة` };
  }

  const current = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');
  const confirm = String(formData.get('confirm') || '');

  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `كلمة المرور الجديدة يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` };
  }
  if (next !== confirm) return { error: 'كلمتا المرور غير متطابقتين' };

  const user = await prisma.user.findUnique({ where: { id: account.id } });
  if (!user) return { error: SESSION_EXPIRED };

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    await recordFailure(scope, account.id, LOGIN_BY_EMAIL);
    return { error: 'كلمة المرور الحالية غير صحيحة' };
  }

  await prisma.user.update({
    where: { id: account.id },
    // Same stamp as the reset path: changing a password ends the sessions that
    // existed before it, including this one's older siblings on other devices.
    data: { passwordHash: await bcrypt.hash(next, 12), passwordChangedAt: new Date() },
  });

  await clearFailures(scope, account.id);

  return { success: 'تم تغيير كلمة المرور بنجاح' };
}
