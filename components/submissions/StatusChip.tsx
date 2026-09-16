import type { SubmissionStatus } from '@prisma/client';
import { SUBMISSION_STATUS_COLORS, SUBMISSION_STATUS_LABELS } from '@/lib/submissions';

export default function StatusChip({ status }: { status: SubmissionStatus }) {
  const color = SUBMISSION_STATUS_COLORS[status];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}
