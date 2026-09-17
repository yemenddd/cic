'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

// The userId ALWAYS comes from the server-side session, never from the client.
// Every write below is scoped by it, so a posted notification id that belongs to
// someone else simply matches no rows instead of leaking or mutating their data.
async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidate() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/notifications');
}

export async function markAsRead(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !id) return;

  // updateMany scoped to BOTH ids: another user's notification matches nothing,
  // and an already-read row is a harmless no-op rather than a crash.
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });

  revalidate();
}

export async function markAllAsRead(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  revalidate();
}
