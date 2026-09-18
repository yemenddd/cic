'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { openAndResolveTarget } from './open';

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

/**
 * Mark one notification read and go where it points.
 *
 * Reading a notification is what marks it read everywhere else in the world,
 * but here the two were separate buttons: following «عرض التفاصيل» left the
 * item unread, so the badge kept counting things the attendee had already
 * acted on. Submitted as a form, so it also works before hydration.
 *
 * The decision of where to go lives in ./open.ts, outside this 'use server'
 * module, so it can be tested — see `npm run check`.
 */
export async function openNotification(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) redirect('/login');

  const target = await openAndResolveTarget(userId, id);
  revalidate();
  redirect(target);
}
