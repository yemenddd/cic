import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import ShiftForm from '../ShiftForm';
import { updateShift } from '../actions';

export default async function EditShiftPage({
  // Next.js 16: params is a Promise and must be awaited.
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shift = await prisma.volunteerShift.findUnique({ where: { id } });
  if (!shift) notFound();

  return (
    <ShiftForm
      title="تعديل فترة التطوّع"
      action={updateShift.bind(null, shift.id)}
      defaults={shift}
    />
  );
}
