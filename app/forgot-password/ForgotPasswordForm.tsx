'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { CircleCheck, Mail } from 'lucide-react';
import { requestReset } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <Mail className="h-4 w-4" />
      {pending ? '...جارٍ الإرسال' : 'أرسل رابط الاستعادة'}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestReset, undefined);
  const emailId = useId();

  // The same screen for an address that has an account and one that does not.
  // Anything else would turn this form into a way to test a list of addresses
  // against the attendee register.
  if (state?.sent) {
    return (
      <div className="flex flex-col items-center py-2 text-center">
        <span
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)' }}
        >
          <CircleCheck className="h-6 w-6" style={{ color: 'var(--accent-cyan)' }} />
        </span>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          إن كان هذا البريد مسجّلاً لدينا، فقد أرسلنا إليه رابطاً لإعادة تعيين كلمة المرور.
          تحقّق من بريدك — والرابط صالح لمدة ساعة واحدة.
        </p>
        <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          لم تجد الرسالة؟ تحقّق من مجلد البريد غير المرغوب فيه.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor={emailId}
          className="mb-1.5 block text-[13px] font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          البريد الإلكتروني
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          dir="ltr"
          className="input-glass"
          placeholder="you@example.com"
        />
      </div>

      {state?.error && (
        <p className="text-[12.5px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
