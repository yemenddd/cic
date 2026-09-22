/**
 * Turns the `code` that Auth.js puts on a failed sign-in into something an
 * Arabic-speaking human can act on.
 *
 * Shared by both login forms so a locked-out attendee and a locked-out admin
 * get the same explanation — and so neither is told "wrong credentials" when
 * the real reason is that they have to wait.
 */
import { noteFromRefusalCode, signInRefusal, statusFromRefusalCode } from '@/lib/account-status';

export function loginErrorMessage(code: string | undefined): string {
  // An account that is waiting, or was refused. Said as what it is: somebody
  // whose password is right would otherwise spend the evening retyping it.
  const status = code ? statusFromRefusalCode(code) : null;
  if (status) return signInRefusal(status, noteFromRefusalCode(code!)) ?? 'بيانات الدخول غير صحيحة';

  const minutes = code?.startsWith('throttled-') ? Number(code.slice('throttled-'.length)) : NaN;

  if (Number.isFinite(minutes) && minutes > 0) {
    const wait =
      minutes === 1
        ? 'دقيقة واحدة'
        : minutes === 2
          ? 'دقيقتين'
          : minutes <= 10
            ? `${minutes} دقائق`
            : `${minutes} دقيقة`;
    return `محاولات كثيرة متتالية — حاول مرة أخرى بعد ${wait}`;
  }

  return 'بيانات الدخول غير صحيحة';
}
