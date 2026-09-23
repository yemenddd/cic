'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Send, CircleCheck, AlertTriangle, MailWarning } from 'lucide-react';
import { sendTestEmail } from './actions';

/**
 * Proving that mail arrives, rather than believing that it will.
 *
 * Everything else on this page is a setting the platform obeys immediately.
 * Mail is the one thing that depends on a service outside it — a key, a
 * domain, DNS records somebody added at a registrar — and every one of those
 * can be wrong in a way that looks exactly like "configured" from in here.
 *
 * So the check is a real send to a real address, and the provider's own
 * refusal is shown as it came: that text is what names the missing record.
 */

function Submit({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !enabled}
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-50"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <Send className="h-4 w-4" />
      {pending ? '...جارٍ الإرسال' : 'أرسل رسالة اختبار'}
    </button>
  );
}

export default function MailCheck({
  configured,
  from,
}: {
  configured: boolean;
  /** The address every message will come from, or '' when unset. */
  from: string;
}) {
  const [state, formAction] = useActionState(sendTestEmail, undefined);

  return (
    <form action={formAction} className="space-y-3.5">
      {!configured && (
        <p
          className="flex items-start gap-2.5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--destructive)' }} />
          <span>
            البريد غير مفعّل. رسائل قبول ورفض الطلبات وروابط استعادة كلمة المرور لا تغادر
            المنصة — أضف <code>RESEND_API_KEY</code> و <code>EMAIL_FROM</code> في إعدادات
            المشروع على Vercel، ثم أعد النشر.
          </span>
        </p>
      )}

      {configured && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          تُرسل كل الرسائل من: <span dir="ltr" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{from}</span>
          {' '}— ويجب أن يكون نطاق هذا العنوان موثَّقاً في Resend، وإلا رُفض كل إرسال.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[16rem] flex-1">
          <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            أرسل اختباراً إلى
          </span>
          <input
            id="settings-test-email"
            name="testEmail"
            type="email"
            dir="ltr"
            placeholder="you@example.com"
            className="input-glass"
          />
        </label>
        <Submit enabled={configured} />
      </div>

      {state?.error && (
        <p className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--destructive)' }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p
          role="status"
          className="flex items-start gap-2 text-[12.5px] leading-relaxed"
          style={{ color: 'var(--accent-cyan)' }}
        >
          <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.success}
        </p>
      )}
    </form>
  );
}
