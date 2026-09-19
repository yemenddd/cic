'use server';

import { headers } from 'next/headers';
import {
  RESET_BY_EMAIL,
  RESET_BY_IP,
  clientIp,
  recordFailure,
  throttleState,
} from '@/lib/rate-limit';
import { pruneResetTokens, requestPasswordReset } from '@/lib/password-reset';

export interface RequestResult {
  /** Shown whether or not the address exists. See below. */
  sent?: boolean;
  error?: string;
}

/**
 * Ask for a reset link.
 *
 * @public-action — signed out is the only state anyone reaches this from, so a
 * session check here would lock out exactly the people it exists for. What
 * stands in for a guard is the throttle below and the fact that the response
 * carries no information about the address.
 *
 * The answer is the same for an address that has an account and one that does
 * not: "if this address is registered, a link is on its way." Anything else
 * turns this form into a way to test a list of addresses against the attendee
 * register — which, for a conference, is a list of who is attending.
 *
 * The throttle is the one place that does answer differently, and only by
 * refusing to do anything at all for a while. That is unavoidable: without it
 * the form is a way to send mail to any address as often as you like.
 */
export async function requestReset(
  _prev: RequestResult | undefined,
  form: FormData,
): Promise<RequestResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 200);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'أدخل بريداً إلكترونياً صحيحاً' };
  }

  const ip = clientIp(await headers());

  const [byIp, byEmail] = await Promise.all([
    ip ? throttleState('reset:ip', ip) : Promise.resolve(null),
    throttleState('reset:email', email),
  ]);
  const blocked = [byIp, byEmail].find((s) => s?.blocked);
  if (blocked) {
    const minutes = Math.max(1, Math.ceil(blocked.retryAfter / 60));
    return { error: `طلبات كثيرة — حاول مرة أخرى بعد ${minutes} دقيقة` };
  }

  // Counted before the work, so a flood is limited whether or not the address
  // turns out to exist.
  await Promise.all([
    ip ? recordFailure('reset:ip', ip, RESET_BY_IP) : Promise.resolve(null),
    recordFailure('reset:email', email, RESET_BY_EMAIL),
  ]);

  await requestPasswordReset(email);
  await pruneResetTokens();

  return { sent: true };
}
