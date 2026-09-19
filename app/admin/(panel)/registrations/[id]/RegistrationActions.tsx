'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, Copy, Trash2, UserPlus } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { createAccountForRegistration, deleteRegistrationAndReturn } from '../actions';

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
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

export default function RegistrationActions({
  registrationId,
  hasAccount,
  accountId,
}: {
  registrationId: string;
  hasAccount: boolean;
  accountId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string; userId?: string } | null>(null);
  const confirm = useConfirm();

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
        الإجراءات
      </h2>

      {created ? (
        // The password exists only in that one response — it is hashed before
        // it is stored — so it has to be handed over before this screen is left.
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'color-mix(in srgb, var(--accent-cyan) 8%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)',
          }}
        >
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            تم إنشاء الحساب
          </p>
          <CopyRow label="البريد" value={created.email} />
          <CopyRow label="كلمة المرور" value={created.password} />
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--destructive)' }}>
            سلّم كلمة المرور لصاحبها الآن عبر قناة موثوقة. لن تظهر مرة أخرى بعد مغادرة هذه الصفحة.
          </p>
          {created.userId && (
            <Link
              href={`/admin/users/${created.userId}`}
              className="inline-flex rounded-xl px-4 py-2 text-[13px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              فتح ملف المستخدم
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!hasAccount && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setNotice(null);
                startTransition(async () => {
                  const result = await createAccountForRegistration(registrationId);
                  if (result.error) {
                    setNotice({ tone: 'error', text: result.error });
                    return;
                  }
                  if (result.password && result.email) {
                    setCreated({ email: result.email, password: result.password, userId: result.userId });
                    return;
                  }
                  setNotice({ tone: 'success', text: result.success ?? '' });
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              أنشئ حساباً لهذا المسجَّل
            </button>
          )}

          {hasAccount && accountId && (
            <Link
              href={`/admin/users/${accountId}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              فتح الحساب المرتبط
            </Link>
          )}

          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: 'حذف هذا التسجيل نهائياً؟',
                body: hasAccount
                  ? 'سيُحذف سجل التسجيل فقط — الحساب المرتبط وبياناته تبقى كما هي.'
                  : 'لا يمكن التراجع.',
                confirmLabel: 'حذف نهائي',
                tone: 'danger',
              });
              if (!ok) return;
              setNotice(null);
              startTransition(async () => {
                const result = await deleteRegistrationAndReturn(registrationId);
                if (result?.error) setNotice({ tone: 'error', text: result.error });
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'transparent', border: '1px solid var(--mat-liquid-border)', color: 'var(--destructive)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف التسجيل
          </button>
        </div>
      )}

      {notice && (
        <p
          className="text-[12.5px]"
          style={{ color: notice.tone === 'error' ? 'var(--destructive)' : 'var(--accent-cyan)' }}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
