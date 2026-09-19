'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { SelectField, TextField } from '@/components/admin/fields';
import { createCheckpoint } from '../actions';

export interface SessionOption {
  id: string;
  label: string;
  day: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-6 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {pending ? '...جارٍ الحفظ' : 'إنشاء نقطة الحضور'}
    </button>
  );
}

/**
 * Adding a checkpoint.
 *
 * The day drives which sessions can be linked, because a checkpoint at a
 * day-two workshop filed under day one would put its attendance in the wrong
 * day's total — and that total is what the organizers read.
 */
export default function NewCheckpointForm({
  days,
  sessions,
}: {
  days: { value: string; label: string }[];
  sessions: SessionOption[];
}) {
  const [state, formAction] = useActionState(createCheckpoint, undefined);
  const [day, setDay] = useState(days[0]?.value ?? '');

  const sessionsForDay = sessions.filter((s) => s.day === day);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/attendance" style={{ color: 'var(--text-tertiary)' }} aria-label="رجوع">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          نقطة حضور جديدة
        </h1>
      </div>

      <form
        action={formAction}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          نقطة الحضور هي المكان الذي تُمسح عنده البطاقات — باب القاعة، أو قاعة ورشة بعينها.
          يُحتسب كل مشارك مرة واحدة في كل نقطة، مهما تكرر مسح بطاقته.
        </p>

        <TextField name="nameAr" label="اسم النقطة" required />

        <SelectField name="day" label="اليوم" defaultValue={day} options={days} onChange={setDay} />

        {sessionsForDay.length > 0 && (
          <SelectField
            name="sessionId"
            label="مرتبطة بجلسة (اختياري)"
            options={[
              { value: '', label: 'بوابة عامة — غير مرتبطة بجلسة' },
              ...sessionsForDay.map((s) => ({ value: s.id, label: s.label })),
            ]}
          />
        )}

        {state?.error && <p className="text-[13px]" style={{ color: 'var(--destructive)' }}>{state.error}</p>}
        {state?.success && <p className="text-[13px]" style={{ color: 'var(--accent-cyan)' }}>{state.success}</p>}

        <div className="pt-2 flex items-center gap-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
