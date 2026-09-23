'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { UserPlus, CircleCheck, AlertTriangle, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { addWalkIn } from './actions';

/**
 * Adding somebody at the door.
 *
 * Two fields open by default — a name and a phone number — because this is
 * filled in standing up with a queue behind it, and every additional required
 * box is another ten seconds per person. Organization and country are there
 * for whoever has the time, folded away for whoever does not.
 *
 * The form does not clear itself on failure: a refused submission with the
 * typing wiped means asking the person for their name a second time.
 */

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <UserPlus className="h-4 w-4" />
      {pending ? '...جارٍ الإضافة' : 'أضف وسجّل حضوره'}
    </button>
  );
}

export default function WalkInForm({
  checkpoints,
  defaultCheckpointId,
}: {
  checkpoints: Array<{ id: string; nameAr: string; isOpen: boolean }>;
  defaultCheckpointId?: string;
}) {
  const [state, formAction] = useActionState(addWalkIn, undefined);
  const [more, setMore] = useState(false);
  // Cleared by React when the action succeeds, because the form is re-keyed —
  // the desk's next person should not inherit the last one's name.
  const [nonce, setNonce] = useState(0);

  // Re-key once per success, so the inputs reset only when a row was written.
  const key = state?.success ? `${nonce}-${state.success}` : `${nonce}`;

  if (checkpoints.length === 0) {
    return (
      <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        أنشئ نقطة حضور أولاً لتتمكن من إضافة الحاضرين من هنا.
      </p>
    );
  }

  const open = checkpoints.filter((c) => c.isOpen);

  return (
    <form
      key={key}
      action={(data) => {
        setNonce((n) => n + 1);
        return formAction(data);
      }}
      className="space-y-3.5"
    >
      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        لمن حضر دون تسجيل مسبق ولا يستطيع إنشاء حساب. يُضاف إلى قاعدة البيانات
        ويُحتسب في الحضور فوراً، ويظهر في التصدير والتقارير مع بقية الحاضرين.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            الاسم <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input name="name" required maxLength={200} autoComplete="off" className="input-glass" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            رقم الهاتف <span style={{ color: '#ef4444' }}>*</span>
          </span>
          <input
            name="phone"
            required
            maxLength={50}
            dir="ltr"
            inputMode="tel"
            autoComplete="off"
            className="input-glass"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            الفئة
          </span>
          <select name="category" defaultValue="visitor" className="input-glass">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.labels.ar}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            نقطة الحضور
          </span>
          <select
            name="checkpointId"
            defaultValue={defaultCheckpointId ?? open[0]?.id ?? checkpoints[0].id}
            className="input-glass"
          >
            {checkpoints.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.isOpen}>
                {c.nameAr}{c.isOpen ? '' : ' (مغلقة)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Nice to have, never in the way. */}
      <button
        type="button"
        onClick={() => setMore((v) => !v)}
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform"
          style={{ transform: more ? 'rotate(180deg)' : 'none' }}
          aria-hidden
        />
        بيانات إضافية (اختيارية)
      </button>

      {more && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              الجهة / الجامعة
            </span>
            <input name="organization" maxLength={200} autoComplete="off" className="input-glass" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              الدولة
            </span>
            <input name="country" maxLength={100} autoComplete="off" className="input-glass" />
          </label>
        </div>
      )}

      {state?.error && (
        <p className="flex items-start gap-2 text-[12.5px]" style={{ color: 'var(--destructive)' }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p
          role="status"
          className="flex items-start gap-2 text-[12.5px]"
          style={{ color: 'var(--accent-cyan)' }}
        >
          <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.success}
        </p>
      )}

      <Submit />
    </form>
  );
}
