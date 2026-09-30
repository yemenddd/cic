'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Send } from 'lucide-react';
import { TextField, TextAreaField, SelectField } from '@/components/admin/fields';
import { mailAudienceOptions, MAIL_ALL, MAIL_ONE } from './audience';

type ActionResult = { error?: string; success?: string } | void;

function SendButton({ reach }: { reach: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || reach === 0}
      className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <Send className="h-4 w-4" />
      {pending ? '...جارٍ الإرسال' : reach === 1 ? 'إرسال الرسالة' : `إرسال إلى ${reach} بريد`}
    </button>
  );
}

export default function Composer({
  action,
  sizes,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  sizes: Record<string, number>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [audience, setAudience] = useState(MAIL_ALL);

  const one = audience === MAIL_ONE;
  // Shown on the button itself, so the size of what is about to happen is
  // visible at the moment of clicking rather than afterwards.
  const reach = one ? 1 : sizes[audience] ?? 0;

  return (
    <form
      action={formAction}
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <TextField name="subject" label="عنوان الرسالة" required />
      <TextAreaField name="body" label="نص الرسالة" required />
      <p className="text-[12px] -mt-2" style={{ color: 'var(--text-tertiary)' }}>
        اترك سطراً فارغاً بين الفقرات. تُرسل الرسالة بقالب المؤتمر نفسه — الشعار والتوقيع تُضاف تلقائياً،
        ويُنادى كل مستلم باسمه الأول.
      </p>

      <SelectField
        name="audience"
        label="من يستلمها"
        defaultValue={MAIL_ALL}
        onChange={setAudience}
        options={mailAudienceOptions().map((o) => ({
          ...o,
          label: o.value === MAIL_ONE ? o.label : `${o.label} — ${sizes[o.value] ?? 0}`,
        }))}
        required
      />

      {/* Rendered only for the one-address case: a field that is ignored most
          of the time is a field somebody fills in and wonders why nothing
          happened. */}
      {one && <TextField name="toEmail" label="البريد المستلِم" type="email" dir="ltr" required />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField name="buttonLabel" label="عنوان الزر (اختياري)" />
        <TextField name="buttonHref" label="مسار الزر" dir="ltr" />
      </div>
      <p className="text-[12px] -mt-2" style={{ color: 'var(--text-tertiary)' }}>
        مسار داخل الموقع فقط، مثل <span dir="ltr">/program</span> — يظهر كزر في أسفل الرسالة.
        اتركهما فارغين إن لم تكن بحاجة إليه.
      </p>

      <label className="flex items-start gap-2.5 cursor-pointer py-1.5">
        <input type="checkbox" name="confirm" className="mt-0.5" />
        <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          أؤكد الإرسال. البريد يصل فوراً ولا يمكن سحبه بعد ذلك.
        </span>
      </label>

      {reach === 0 && (
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          لا يوجد أحد في هذه الفئة له بريد صالح.
        </p>
      )}
      {state?.error && <p className="text-[13px]" style={{ color: '#ef4444' }}>{state.error}</p>}
      {state?.success && <p className="text-[13px]" style={{ color: '#22c55e' }}>{state.success}</p>}

      <div className="pt-2" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
        <SendButton reach={reach} />
      </div>
    </form>
  );
}
