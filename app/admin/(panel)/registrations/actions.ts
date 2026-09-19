'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { assertAdmin } from '@/lib/auth-guards';

export async function deleteRegistration(id: string): Promise<void> {
  await assertAdmin();
  await prisma.registration.delete({ where: { id } });
  revalidatePath('/admin/registrations');
}
