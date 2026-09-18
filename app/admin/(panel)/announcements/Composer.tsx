'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Megaphone } from 'lucide-react';
import { TextField, TextAreaField, SelectField } from '@/components/admin/fields';
import { audienceOptions, AUDIENCE_ALL } from './audience';

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
      <Megaphone className="h-4 w-4" />
      {pending ? '...جارٍ الإرسال' : `إرسال إلى ${reach} مشارك`}
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
  const [audience, setAudience] = useState(AUDIENCE_ALL);

  // The count is shown on the button itself, so the size of what is about to
  // happen is visible at the moment of clicking rather than afterwards.
  const reach = sizes[audience] ?? 0;

  return (
    <form
      action={formAction}
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <TextField name="title" label="عنوان الإعلان" required />
      <TextAreaField name="body" label="نص الإعلان" required />

      <SelectField
        name="audience"
        label="من يستلمه"
        defaultValue={AUDIENCE_ALL}
        onChange={setAudience}
        options={audienceOptions().map((o) => ({
          ...o,
          label: `${o.label} — ${sizes[o.value] ?? 0}`,
        }))}
        required
      />

      <TextField name="link" label="رابط داخلي (اختياري)" dir="ltr" />
      <p className="text-[12px] -mt-2" style={{ color: 'var(--text-tertiary)' }}>
        مسار داخل الموقع فقط، مثل <span dir="ltr">/program</span> — يظهر كزر «عرض التفاصيل» في إشعار المستلم.
      </p>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" name="confirm" className="mt-0.5" />
        <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          أؤكد الإرسال. الإعلان يصل فوراً إلى إشعارات المستلمين ولا يمكن سحبه بعد ذلك.
        </span>
      </label>

      {reach === 0 && (
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          لا يوجد أحد في هذه الفئة حالياً.
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
