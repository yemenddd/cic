'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, KeyRound, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { deleteUser, resetUserPassword, setUserRole, setUserCategory } from '../actions';
import { CATEGORIES } from '@/lib/categories';

function Notice({ text, tone }: { text: string; tone: 'error' | 'success' }) {
  return (
    <p
      className="text-[12.5px]"
      style={{ color: tone === 'error' ? 'var(--destructive)' : 'var(--accent-cyan)' }}
    >
      {text}
    </p>
  );
}

// The generated password exists only in this response — it is hashed before it
// is stored, so there is no second chance to read it. Hence the standalone
// panel, the copy button and the warning rather than a passing toast.
function GeneratedPassword({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <p className="text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
        كلمة المرور الجديدة
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <code
          className="flex-1 min-w-0 rounded-lg px-3 py-2 text-[15px] font-semibold tracking-wider break-all"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-primary)',
          }}
          dir="ltr"
        >
          {password}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(password).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              },
              () => setCopied(false)
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </button>
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--destructive)' }}>
        انسخ كلمة المرور الآن وسلّمها للمستخدم عبر قناة موثوقة. لن تظهر مرة أخرى بعد مغادرة هذه
        الصفحة، ولا يمكن استرجاعها — الحل الوحيد بعدها هو إعادة التعيين من جديد.
      </p>
    </div>
  );
}

export default function UserAdminActions({
  userId,
  role,
  category,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  category: string | null;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const nextRole: UserRole = role === 'ADMIN' ? 'ATTENDEE' : 'ADMIN';

  function run(fn: () => Promise<{ error?: string; success?: string; password?: string }>) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.password) setPassword(result.password);
      if (result?.success) setSuccess(result.success);
    });
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
        إجراءات الإدارة
      </h2>

      <div>
        <label className="block text-[12.5px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          فئة المشاركة
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                disabled={pending || active}
                onClick={() => run(() => setUserCategory(userId, c.id))}
                className="rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
                style={{
                  background: active ? 'var(--primary)' : 'var(--mat-liquid-bg)',
                  color: active ? 'var(--primary-foreground)' : 'var(--text-primary)',
                  border: '1px solid var(--mat-liquid-border)',
                }}
              >
                {c.labels.ar}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          تقديم الابتكارات متاح لفئة «مشارك» فقط — غيّر الفئة هنا لمن اختار الفئة الخطأ عند التسجيل.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('إعادة تعيين كلمة مرور هذا المستخدم؟ ستتوقف كلمة مروره الحالية عن العمل فوراً.')) return;
            run(() => resetUserPassword(userId));
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <KeyRound className="h-3.5 w-3.5" />
          إعادة تعيين كلمة المرور
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const label = nextRole === 'ADMIN' ? 'ترقية هذا المستخدم إلى مدير؟' : 'تحويل هذا المدير إلى مشارك؟';
            if (!confirm(label)) return;
            run(() => setUserRole(userId, nextRole));
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-primary)',
          }}
        >
          {nextRole === 'ADMIN' ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
          {nextRole === 'ADMIN' ? 'ترقية إلى مدير' : 'تحويل إلى مشارك'}
        </button>

        <button
          type="button"
          disabled={pending || isSelf}
          onClick={() => {
            if (!confirm('حذف هذا المستخدم نهائياً؟ ستُحذف معه ابتكاراته وجلساته المحفوظة.')) return;
            run(() => deleteUser(userId));
          }}
          title={isSelf ? 'لا يمكنك حذف حسابك الحالي' : undefined}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-50"
          style={{
            background: 'transparent',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--destructive)',
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف المستخدم
        </button>
      </div>

      {pending && <Notice tone="success" text="...جارٍ التنفيذ" />}
      {error && <Notice tone="error" text={error} />}
      {success && !password && <Notice tone="success" text={success} />}
      {password && <GeneratedPassword password={password} />}
    </div>
  );
}
