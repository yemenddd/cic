'use client';

import { useTransition } from 'react';
import { Lock, LockOpen, X } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { toggleShiftOpen, removeAssignment } from './actions';

/**
 * Open or close a shift to new claims.
 *
 * Closing is not deleting: the people already on it stay, and the rota stops
 * accepting more. That distinction is the whole reason this control exists
 * beside the delete button rather than instead of it.
 */
export function OpenToggle({ id, isOpen }: { id: string; isOpen: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={isOpen}
      onClick={() => startTransition(() => toggleShiftOpen(id, !isOpen))}
      title={isOpen ? 'إغلاق التسجيل في هذه الفترة' : 'فتح التسجيل في هذه الفترة'}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold transition-opacity disabled:opacity-50"
      style={
        isOpen
          ? {
              background: 'color-mix(in srgb, var(--accent-cyan) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)',
              color: 'var(--accent-cyan)',
            }
          : {
              background: 'var(--mat-liquid-bg)',
              border: '1px solid var(--mat-liquid-border)',
              color: 'var(--text-tertiary)',
            }
      }
    >
      {isOpen ? <LockOpen className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {isOpen ? 'مفتوحة' : 'مغلقة'}
    </button>
  );
}

/** Take one volunteer off one shift. Confirmed, because they were told they had it. */
export function RemoveVolunteer({
  shiftId,
  userId,
  name,
}: {
  shiftId: string;
  userId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`إزالة ${name} من هذه الفترة`}
      onClick={async () => {
        const ok = await confirm({
          title: `إزالة «${name}» من هذه الفترة؟`,
          confirmLabel: 'إزالة',
          tone: 'danger',
        });
        if (!ok) return;
        startTransition(() => removeAssignment(shiftId, userId));
      }}
      className="rounded-full p-0.5 transition-opacity disabled:opacity-50"
      style={{ color: 'var(--text-tertiary)' }}
    >
      <X className="h-3 w-3" />
    </button>
  );
}
