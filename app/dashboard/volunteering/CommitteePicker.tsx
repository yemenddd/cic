'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, AlertTriangle, Repeat } from 'lucide-react';
import { COMMITTEES, committeeLabel } from '@/lib/committees';
import { chooseCommittee } from './actions';

/**
 * Which committee a volunteer works with.
 *
 * Asked before anything else, because it is what the rest of the page depends
 * on: a shift belongs to a committee, and the schedule of five committees a
 * volunteer is not in is noise they would have to read past every time.
 *
 * Each committee says what it actually does. "اللوجستيك" means nothing to
 * somebody choosing between six words, and a volunteer who picks wrong has to
 * be moved by hand later.
 */
export default function CommitteePicker({
  current,
  compact,
}: {
  current: string | null;
  /** The small "change committee" form, once one has been chosen. */
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const pick = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await chooseCommittee(id);
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  };

  if (compact && !open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold"
          style={{
            background: 'color-mix(in srgb, var(--accent-violet) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)',
            color: 'var(--accent-violet)',
          }}
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {committeeLabel(current)}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Repeat className="h-3.5 w-3.5" aria-hidden />
          تغيير اللجنة
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <h2 className="font-outfit text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
        {current ? 'انتقل إلى لجنة أخرى' : 'اختر لجنتك'}
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        تعمل مع لجنة واحدة، وتحجز فتراتها. يمكنك الانتقال لاحقاً ما دمت لم تحجز فترة بعد.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {COMMITTEES.map((c) => {
          const isCurrent = c.id === current;
          return (
            <button
              key={c.id}
              type="button"
              disabled={pending || isCurrent}
              onClick={() => pick(c.id)}
              aria-pressed={isCurrent}
              className="platform-activity-row rounded-xl p-3.5 text-start transition-opacity disabled:opacity-70"
              style={{
                background: isCurrent ? 'var(--surface-highlight)' : 'var(--mat-liquid-bg)',
                border: `1px solid ${isCurrent ? 'var(--accent-violet)' : 'var(--mat-liquid-border)'}`,
              }}
            >
              <span className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {c.labelAr}
                </span>
                {isCurrent && (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent-violet)' }} aria-hidden />
                )}
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              </span>
              <span
                className="mt-1 block text-[11.5px] leading-relaxed"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {c.descriptionAr}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed"
          style={{ color: 'var(--destructive)' }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {compact && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 text-[12px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          إلغاء
        </button>
      )}
    </div>
  );
}
