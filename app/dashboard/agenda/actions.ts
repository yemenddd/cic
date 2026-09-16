'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

// The userId ALWAYS comes from the server-side session, never from the client.
// If it were a parameter, any signed-in attendee could post someone else's id
// and rewrite their agenda.
async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidate() {
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
}

export async function saveSession(sessionId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !sessionId) return;

  // createMany + skipDuplicates makes a double-click (or a stale page saving an
  // already-saved session) a no-op instead of a unique-constraint crash.
  await prisma.savedSession.createMany({
    data: [{ userId, sessionId }],
    skipDuplicates: true,
  });

  revalidate();
}

export async function unsaveSession(sessionId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !sessionId) return;

  // deleteMany scoped to BOTH ids: it deletes nothing when the row belongs to
  // another user, and never throws when the row is already gone.
  await prisma.savedSession.deleteMany({ where: { userId, sessionId } });

  revalidate();
}
