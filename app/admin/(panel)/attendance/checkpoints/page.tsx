import { prisma } from '@/lib/db/client';
import { DAY_KEYS, DAY_LABELS, dayLabel } from '@/lib/attendance';
import NewCheckpointForm, { type SessionOption } from './NewCheckpointForm';

export const metadata = { title: 'نقاط الحضور | لوحة CICT' };

export default async function NewCheckpointPage() {
  const sessions = await prisma.programSession.findMany({
    orderBy: [{ day: 'asc' }, { order: 'asc' }],
    select: { id: true, titleAr: true, day: true, time: true },
  });

  const options: SessionOption[] = sessions.map((s) => ({
    id: s.id,
    label: `${s.titleAr} — ${dayLabel(s.day)} ${s.time}`,
    day: s.day,
  }));

  return (
    <NewCheckpointForm
      days={DAY_KEYS.map((d) => ({ value: d, label: DAY_LABELS[d] }))}
      sessions={options}
    />
  );
}
