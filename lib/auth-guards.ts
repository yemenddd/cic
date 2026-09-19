import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

/**
 * Authoritative identity checks, read from the database.
 *
 * Why not just trust `session.user.role`? Because it lives in the JWT, which
 * is written once at sign-in and then carried for the life of the token. That
 * makes it a *stale* copy: demoting an admin, or deleting an account
 * outright, would not take effect until that person's token expired. Someone
 * whose admin rights were revoked could keep reviewing submissions and
 * resetting other people's passwords in the meantime.
 *
 * So the split is:
 *   - proxy.ts does the fast, optimistic JWT check to keep signed-out
 *     visitors out of the panels. It is a redirect, not a security boundary.
 *   - these helpers are the real boundary, and every server action and every
 *     panel layout goes through them.
 *
 * The cost is one indexed primary-key lookup per guarded request, which is
 * the correct trade for revocation that actually works.
 */

export interface GuardedUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'ATTENDEE';
  category: string | null;
}

/** The signed-in user as the database currently sees them, or null. */
export async function currentUser(): Promise<GuardedUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  // A deleted account still carries a valid-looking token, so existence is
  // re-checked here rather than inferred from the session.
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, category: true },
  });

  return user ?? null;
}

/** The signed-in user, but only if they are still an admin right now. */
export async function requireAdmin(): Promise<GuardedUser | null> {
  const user = await currentUser();
  return user?.role === 'ADMIN' ? user : null;
}

/**
 * The same check, for actions that return nothing.
 *
 * `requireAdmin` returns null so a caller can turn refusal into a message the
 * form can render. An action typed `Promise<void>` — a delete behind an icon
 * button — has nowhere to put that message, and silently returning would make
 * an unauthorized call indistinguishable from a successful one. Throwing is
 * the honest outcome: it cannot be reached from the panel, so anything that
 * does reach it is a direct POST to the action endpoint.
 */
export async function assertAdmin(): Promise<GuardedUser> {
  const user = await requireAdmin();
  if (!user) throw new Error('غير مصرح لك بهذا الإجراء');
  return user;
}
