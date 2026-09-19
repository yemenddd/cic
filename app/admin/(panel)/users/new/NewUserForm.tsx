'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { SUBMISSION_TRACKS } from '@/lib/submissions';
import { TextField, SelectField } from '@/components/admin/fields';
import { createUser } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-6 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {pending ? '...جارٍ الإنشاء' : 'إنشاء الحساب'}
    </button>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <code
        className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[13.5px] font-semibold break-all"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--mat-liquid-border)',
          color: 'var(--text-primary)',
        }}
        dir="ltr"
      >
        {value}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            },
            () => setCopied(false),
          );
        }}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold"
        style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'تم' : 'نسخ'}
      </button>
    </div>
  );
}

/**
 * Creating an account from the desk.
 *
 * Not FormShell, because what happens after a successful save is the point:
 * the password exists only in that one response and is never stored, so it has
 * to be shown, copied and handed over before this screen is left. A form that
 * redirected on success would throw it away.
 */
export default function NewUserForm() {
  const [state, formAction] = useActionState(createUser, undefined);

  const created = state?.password && state.email;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" style={{ color: 'var(--text-tertiary)' }} aria-label="رجوع">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          إنشاء حساب
        </h1>
      </div>

      {created ? (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'color-mix(in srgb, var(--accent-cyan) 8%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)',
          }}
        >
          <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            تم إنشاء الحساب
          </h2>

          <div className="space-y-2.5">
            <CopyRow label="البريد" value={state.email!} />
            <CopyRow label="كلمة المرور" value={state.password!} />
            {state.code && <CopyRow label="رمز التأكيد" value={state.code} />}
          </div>

          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--destructive)' }}>
            سلّم كلمة المرور للمستخدم الآن عبر قناة موثوقة. لن تظهر مرة أخرى بعد مغادرة هذه الصفحة،
            ولا يمكن استرجاعها — الحل الوحيد بعدها هو إعادة التعيين.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href={`/admin/users/${state.userId}`}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              فتح ملف المستخدم
            </Link>
            <Link
              href="/admin/users/new"
              className="rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
            >
              إنشاء حساب آخر
            </Link>
          </div>
        </div>
      ) : (
        <form
          action={formAction}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            يُنشئ حساباً كاملاً وسجل تسجيل ورمز تأكيد — تماماً كما لو سجّل المستخدم بنفسه من الموقع.
            كلمة المرور تُولَّد تلقائياً وتُعرض مرة واحدة بعد الحفظ.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="الاسم الكامل" required />
            <TextField name="email" label="البريد الإلكتروني" type="email" required dir="ltr" />
            <TextField name="phone" label="رقم الهاتف" dir="ltr" />
            <TextField name="country" label="الدولة" />
            <TextField name="organization" label="الجهة" />
            <SelectField
              name="category"
              label="الفئة"
              defaultValue="visitor"
              options={CATEGORIES.map((c) => ({ value: c.id, label: c.labels.ar }))}
            />
            <SelectField
              name="track"
              label="المسار"
              options={[{ value: '', label: 'بدون مسار' }, ...SUBMISSION_TRACKS.map((t) => ({ value: t, label: t }))]}
            />
            <SelectField
              name="role"
              label="الصلاحية"
              defaultValue="ATTENDEE"
              options={[
                { value: 'ATTENDEE', label: 'مشارك' },
                { value: 'ADMIN', label: 'مدير' },
              ]}
            />
          </div>

          {state?.error && (
            <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>
          )}

          <div className="pt-2 flex items-center gap-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
            <SubmitButton />
          </div>
        </form>
      )}
    </div>
  );
}
