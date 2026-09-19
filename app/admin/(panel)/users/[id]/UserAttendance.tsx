'use client';

import { useState, useTransition } from 'react';
import { CircleCheck, Trash2, UserCheck } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { manualCheckIn, undoAttendance } from '../../attendance/actions';
import { ATTENDANCE_METHOD_LABELS, OUTCOME_LABELS, dayLabel } from '@/lib/attendance';
import type { AttendanceMethod } from '@prisma/client';

export interface AttendanceEntry {
  id: string;
  checkpointName: string;
  day: string;
  method: AttendanceMethod;
  checkedInAt: string;
  recordedBy: string | null;
}

export interface CheckpointOption {
  id: string;
  label: string;
}

const TIME = new Intl.DateTimeFormat('ar-u-nu-latn', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * This person's attendance, and the two ways to change it by hand.
 *
 * Manual check-in exists because a badge on a dead phone is still a person
 * standing in the room; undo exists because a scanner pointed at the wrong
 * pass would otherwise be a permanently wrong number.
 */
export default function UserAttendance({
  userId,
  entries,
  checkpoints,
}: {
  userId: string;
  entries: AttendanceEntry[];
  checkpoints: CheckpointOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [checkpointId, setCheckpointId] = useState(checkpoints[0]?.id ?? '');
  const confirm = useConfirm();

  function checkIn() {
    if (!checkpointId) return;
    setNotice(null);
    startTransition(async () => {
      const outcome = await manualCheckIn(checkpointId, userId);
      setNotice(
        outcome.status === 'recorded'
          ? { tone: 'success', text: OUTCOME_LABELS.recorded }
          : { tone: 'error', text: OUTCOME_LABELS[outcome.status] },
      );
    });
  }

  async function undo(id: string) {
    const ok = await confirm({
      title: 'حذف سجل الحضور هذا؟',
      body: 'سيُحتسب هذا المشارك غائباً عن هذه النقطة حتى يُمسح مجدداً.',
      confirmLabel: 'حذف',
      tone: 'danger',
    });
    if (!ok) return;
    setNotice(null);
    startTransition(async () => {
      const result = await undoAttendance(id);
      setNotice(
        result.error
          ? { tone: 'error', text: result.error }
          : { tone: 'success', text: result.success ?? '' },
      );
    });
  }

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
        سجل الحضور
      </h2>

      {entries.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          لم يُسجَّل حضور هذا المستخدم في أي نقطة بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <CircleCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                <span className="min-w-0">
                  <span className="block text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
                    {e.checkpointName}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {dayLabel(e.day)} · {TIME.format(new Date(e.checkedInAt))} ·{' '}
                    {ATTENDANCE_METHOD_LABELS[e.method]}
                    {e.recordedBy ? ` · بواسطة ${e.recordedBy}` : ''}
                  </span>
                </span>
              </span>

              <button
                type="button"
                disabled={pending}
                onClick={() => void undo(e.id)}
                className="rounded-lg p-1.5 transition-opacity disabled:opacity-50"
                style={{ color: 'var(--destructive)' }}
                aria-label="حذف سجل الحضور"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {checkpoints.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 pt-1">
          <div className="min-w-[200px] flex-1">
            <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              تسجيل حضور يدوي
            </label>
            <select
              value={checkpointId}
              onChange={(e) => setCheckpointId(e.target.value)}
              className="input-glass"
              style={{ padding: '9px 12px', fontSize: '13px' }}
            >
              {checkpoints.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={pending || !checkpointId}
            onClick={checkIn}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <UserCheck className="h-4 w-4" />
            تسجيل الحضور
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
