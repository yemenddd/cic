'use client';

import { useActionState, useId, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { CircleCheck, Eye, EyeOff, KeyRound } from 'lucide-react';
import { resetPassword } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <KeyRound className="h-4 w-4" />
      {pending ? '...جارٍ الحفظ' : 'حفظ كلمة المرور'}
    </button>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [reveal, setReveal] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {/* Scoped to ltr: a password reads left to right, so the padding
          reserved for the reveal button and the button itself must resolve
          against the same direction — the sign-in form had them on opposite
          sides, with the eye sitting on top of the first characters. */}
      <div className="relative" dir="ltr">
        <input
          id={id}
          name={name}
          type={reveal ? 'text' : 'password'}
          required
          minLength={10}
          autoComplete={autoComplete}
          className="input-glass"
          style={{ paddingInlineEnd: 44 }}
        />
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          className="absolute top-1/2 -translate-y-1/2 rounded-lg p-1.5"
          style={{ insetInlineEnd: 8, color: 'var(--text-tertiary)' }}
        >
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPassword, undefined);
  const passwordId = useId();
  const confirmId = useId();

  if (state?.done) {
    return (
      <div className="flex flex-col items-center py-2 text-center">
        <span
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)' }}
        >
          <CircleCheck className="h-6 w-6" style={{ color: 'var(--accent-cyan)' }} />
        </span>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول بها.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-[14px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <PasswordField id={passwordId} name="password" label="كلمة المرور الجديدة" autoComplete="new-password" />
      <PasswordField id={confirmId} name="confirm" label="تأكيد كلمة المرور" autoComplete="new-password" />

      <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
        10 أحرف على الأقل.
      </p>

      {state?.error && (
        <p className="text-[12.5px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}
