'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, UserMinus, UserPlus, AlertTriangle } from 'lucide-react';
import { claimShift, releaseShift } from './actions';

/**
 * Claim or release one shift.
 *
 * The refusal is rendered here, beside the shift it is about. A volunteer
 * refused because the slot clashes with one they already hold needs to read
 * that next to the slot in question — a banner at the top of the page would
 * make them work out which of eight rows it referred to.
 */
export default function ShiftButton({
  shiftId,
  mine,
  disabled,
  disabledLabel,
  disabledTitle,
}: {
  shiftId: string;
  mine: boolean;
  /** Full, closed, or clashing — decided on the server and passed in. */
  disabled?: boolean;
  disabledLabel?: string;
  /** The long form of the same reason, for anyone who stops on the chip. */
  disabledTitle?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = mine ? await releaseShift(shiftId) : await claimShift(shiftId);
      if (result?.error) setError(result.error);
    });
  };

  // Nothing to press: the row says why, and an enabled button that always
  // refuses is worse than no button.
  if (!mine && disabled) {
    return (
      <span
        title={disabledTitle}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold"
        style={{
          background: 'var(--mat-liquid-bg)',
          border: '1px solid var(--mat-liquid-border)',
          color: 'var(--text-tertiary)',
        }}
      >
        {disabledLabel ?? 'غير متاح'}
      </span>
    );
  }

  const Icon = pending ? Loader2 : mine ? UserMinus : UserPlus;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <button
        type="button"
        disabled={pending}
        aria-pressed={mine}
        onClick={run}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
        style={
          mine
            ? {
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }
            : {
                background: 'var(--primary)',
                border: '1px solid var(--primary)',
                color: 'var(--primary-foreground)',
              }
        }
      >
        <Icon className={`h-3.5 w-3.5${pending ? ' animate-spin' : ''}`} />
        {mine ? 'إلغاء' : 'أتطوّع'}
      </button>

      {error && (
        <span
          role="status"
          className="inline-flex max-w-[15rem] items-start gap-1 text-end text-[11.5px] leading-snug"
          style={{ color: 'var(--destructive)' }}
        >
          <AlertTriangle className="mt-[2px] h-3 w-3 shrink-0" aria-hidden />
          {error}
        </span>
      )}
    </div>
  );
}

/** The quiet marker on a shift the volunteer already holds. */
export function MineChip() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold"
      style={{
        background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent-cyan) 32%, transparent)',
        color: 'var(--accent-cyan)',
      }}
    >
      <Check className="h-3 w-3 shrink-0" aria-hidden />
      في جدولي
    </span>
  );
}
