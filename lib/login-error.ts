/**
 * Turns the `code` that Auth.js puts on a failed sign-in into something an
 * Arabic-speaking human can act on.
 *
 * Shared by both login forms so a locked-out attendee and a locked-out admin
 * get the same explanation — and so neither is told "wrong credentials" when
 * the real reason is that they have to wait.
 */
export function loginErrorMessage(code: string | undefined): string {
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
