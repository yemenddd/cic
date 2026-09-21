import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { currentUser } from '@/lib/auth-guards';

/**
 * How many unread notifications the caller has.
 *
 * Exists so the bell in the sidebar can be current without the page being
 * reloaded. An announcement goes out to everyone at once — a change of room,
 * a session moved — and a badge that only updates on navigation tells people
 * about it whenever they next happen to click something, which for somebody
 * reading their own agenda may be never.
 *
 * Deliberately returns a count and nothing else. It is polled, so it must stay
 * cheap, and a number leaks nothing that the badge does not already show.
 *
 * Guarded through currentUser rather than the session alone: this is a
 * database read keyed by account, and a deleted account still carries a
 * valid-looking token.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  const count = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json(
    { count },
    // Never cached, by the browser or by anything in front of it: a count that
    // is one person's and thirty seconds old is worse than no count at all.
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
