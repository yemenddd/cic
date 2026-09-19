'use server';

import { MIN_PASSWORD_LENGTH, completePasswordReset } from '@/lib/password-reset';

export interface ResetResult {
  done?: boolean;
  error?: string;
}

/**
 * Set a new password from a reset link.
 *
 * @public-action — the caller is by definition signed out. The token is the
 * credential: 256 bits of randomness, stored only as a hash, single-use and
 * hour-limited, which is a stronger claim than a session cookie.
 *
 * Unthrottled on purpose, unlike the request half: the token is 256 bits of
 * randomness behind a unique index, so there is nothing here to guess at a
 * rate worth limiting — and a limit keyed on anything an attacker controls
 * would only give them a way to lock a real person out of their own reset.
 */
export async function resetPassword(
  _prev: ResetResult | undefined,
  form: FormData,
): Promise<ResetResult> {
  const token = String(form.get('token') ?? '');
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm') ?? '');

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` };
  }
  if (password !== confirm) return { error: 'كلمتا المرور غير متطابقتين' };

  const outcome = await completePasswordReset(token, password);

  if (outcome.status === 'invalid-token') {
    return { error: 'هذا الرابط لم يعد صالحاً — اطلب رابطاً جديداً' };
  }
  if (outcome.status === 'weak-password') {
    return { error: `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل` };
  }

  return { done: true };
}
