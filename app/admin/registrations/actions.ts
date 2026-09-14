'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';

export async function deleteRegistration(id: string): Promise<void> {
  await prisma.registration.delete({ where: { id } });
  revalidatePath('/admin/registrations');
}
