'use client';

import { useState, useTransition } from 'react';
import { DoorClosed, DoorOpen, Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { deleteCheckpoint, setCheckpointOpen } from './actions';

/** Open/close and delete, for one checkpoint row. */
export default function CheckpointControls({
  checkpointId,
  isOpen,
  attendance,
}: {
  checkpointId: string;
  isOpen: boolean;
  attendance: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && (
        <span className="text-[11.5px]" style={{ color: 'var(--destructive)' }}>{error}</span>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setCheckpointOpen(checkpointId, !isOpen))}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: 'var(--mat-liquid-bg)',
          border: '1px solid var(--mat-liquid-border)',
          color: isOpen ? 'var(--text-primary)' : 'var(--accent-cyan)',
        }}
      >
        {isOpen ? <DoorClosed className="h-3.5 w-3.5" /> : <DoorOpen className="h-3.5 w-3.5" />}
        {isOpen ? 'إغلاق' : 'فتح'}
      </button>

      {/* Offered only while there is nothing to lose. A checkpoint that has
          counted people is closed, never deleted — the action refuses it
          server-side too, this just stops the button from lying. */}
      {attendance === 0 && (
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            const ok = await confirm({
              title: 'حذف نقطة الحضور هذه؟',
              body: 'لم يُسجَّل عندها أي حضور، فلن تفقد أي بيانات.',
              confirmLabel: 'حذف',
              tone: 'danger',
            });
            if (!ok) return;
            run(() => deleteCheckpoint(checkpointId));
          }}
          className="rounded-lg p-1.5 transition-opacity disabled:opacity-50"
          style={{ color: 'var(--destructive)' }}
          aria-label="حذف نقطة الحضور"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
