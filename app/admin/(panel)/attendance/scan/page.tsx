import { prisma } from '@/lib/db/client';
import { CHECKPOINT_KIND_LABELS, dayLabel, suggestedCheckpoint } from '@/lib/attendance';
import { ensureDefaultCheckpoints } from '@/lib/attendance-record';
import Scanner, { type ScannerCheckpoint } from './Scanner';

export const metadata = { title: 'مسح الحضور | لوحة CICT' };

export default async function ScanPage() {
  // The scanner has to work the first time it is opened, at a desk, with a
  // queue already forming — "create a checkpoint first" is not an acceptable
  // first screen on the morning of day one.
  await ensureDefaultCheckpoints();

  const checkpoints = await prisma.checkpoint.findMany({
    orderBy: [{ day: 'asc' }, { order: 'asc' }],
    select: { id: true, nameAr: true, day: true, kind: true, isOpen: true },
  });

  const options: ScannerCheckpoint[] = checkpoints.map((c) => ({
    id: c.id,
    label: `${c.nameAr} — ${dayLabel(c.day)} · ${CHECKPOINT_KIND_LABELS[c.kind]}`,
    isOpen: c.isOpen,
  }));

  // Today's open gate when the conference is running, so the desk opens this
  // page and starts scanning with nothing to choose.
  const suggested = suggestedCheckpoint(checkpoints);

  return <Scanner checkpoints={options} initialCheckpointId={suggested?.id ?? ''} />;
}
