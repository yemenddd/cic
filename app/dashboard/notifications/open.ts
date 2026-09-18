import { prisma } from '@/lib/db/client';

/**
 * Mark one notification read and work out where opening it should lead.
 *
 * Deliberately not in actions.ts: every export of a 'use server' module is a
 * callable endpoint, and this one is also the half worth testing — it decides
 * a redirect target, which is exactly the kind of thing that becomes an open
 * redirect when nobody checks it.
 *
 * The target comes from the stored row, never from the request, and the lookup
 * is scoped to the owner: another attendee's id matches nothing, so it writes
 * nothing and falls back to the feed rather than revealing where their
 * notification pointed.
 */
export const NOTIFICATIONS_PATH = '/dashboard/notifications';

/** Internal paths only — "//evil.com" and "/\evil.com" are not internal. */
export function isInternalPath(link: string | null): boolean {
  return Boolean(link) && /^\/[^/\\]/.test(link as string);
}

export async function openAndResolveTarget(userId: string, id: string): Promise<string> {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: { link: true },
  });

  if (!notification) return NOTIFICATIONS_PATH;

  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });

  return isInternalPath(notification.link) ? (notification.link as string) : NOTIFICATIONS_PATH;
}
