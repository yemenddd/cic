'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, KeyRound, QrCode, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import {
  deleteUser,
  regenerateConfirmationCode,
  resetUserPassword,
  setUserRole,
  setUserCategory,
} from '../actions';
import { CATEGORIES } from '@/lib/categories';
import { useConfirm } from '@/components/platform/ConfirmDialog';

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
  hasCode,
}: {
  userId: string;
  role: UserRole;
  category: string | null;
  isSelf: boolean;
  /** Whether a badge code has ever been issued — changes the button's wording. */
  hasCode: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const confirm = useConfirm();

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
          onClick={async () => {
            const ok = await confirm({
              title: 'إعادة تعيين كلمة مرور هذا المستخدم؟',
              body: 'ستتوقف كلمة مروره الحالية عن العمل فوراً، وتُعرض الكلمة الجديدة مرة واحدة.',
              confirmLabel: 'إعادة التعيين',
            });
            if (!ok) return;
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
          onClick={async () => {
            const promoting = nextRole === 'ADMIN';
            const ok = await confirm({
              title: promoting ? 'ترقية هذا المستخدم إلى مدير؟' : 'تحويل هذا المدير إلى مشارك؟',
              body: promoting
                ? 'سيصبح قادراً على تعديل الموقع وقراءة بيانات كل المشاركين وحذف الحسابات.'
                : 'سيفقد الوصول إلى لوحة الإدارة فوراً.',
              confirmLabel: promoting ? 'ترقية' : 'تحويل',
              tone: promoting ? 'danger' : 'default',
            });
            if (!ok) return;
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
          disabled={pending}
          onClick={async () => {
            const ok = await confirm({
              title: hasCode ? 'إصدار رمز تأكيد جديد؟' : 'إصدار رمز تأكيد لهذا المستخدم؟',
              body: hasCode
                ? 'سيتوقف الرمز الحالي وأي بطاقة مطبوعة منه عن العمل. رمز QR لا يتأثر.'
                : undefined,
              confirmLabel: 'إصدار',
              tone: hasCode ? 'danger' : 'default',
            });
            if (!ok) return;
            run(() => regenerateConfirmationCode(userId));
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-primary)',
          }}
        >
          <QrCode className="h-3.5 w-3.5" />
          {hasCode ? 'إصدار رمز تأكيد جديد' : 'إصدار رمز تأكيد'}
        </button>

        <button
          type="button"
          disabled={pending || isSelf}
          onClick={async () => {
            const ok = await confirm({
              title: 'حذف هذا المستخدم نهائياً؟',
              body: 'ستُحذف معه ابتكاراته وجلساته المحفوظة وسجل حضوره. لا يمكن التراجع.',
              confirmLabel: 'حذف نهائي',
              tone: 'danger',
            });
            if (!ok) return;
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
