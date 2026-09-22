import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth-guards';
import { prisma } from '@/lib/db/client';
import AdminShell from '@/components/admin/AdminShell';

/**
 * The gate for every admin route except /admin/login (which sits outside this
 * route group precisely so it stays reachable while signed out).
 *
 * proxy.ts also checks the role, but it reads it from the JWT — a copy written
 * at sign-in and carried for up to 30 days. This re-reads it from the
 * database, so revoking someone's admin rights takes effect on their next
 * request rather than whenever their token happens to expire.
 *
 * Because this runs above every admin page, a demoted admin stops seeing
 * registrations, attendee records and the review queue immediately — not just
 * when they try to act on them.
 */
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  // The account is gone, or the token no longer matches anyone.
  if (!user) redirect('/admin/login');

  // Still a real account, just not an admin one — their own dashboard is the
  // honest destination, not a login form they've already passed.
  if (user.role !== 'ADMIN') redirect('/dashboard');

  // Counted here, in a Server Component, so the badge is right on first paint.
  // Somebody is waiting to be let in, and that should be visible from whatever
  // page an organizer happens to open.
  const pendingApprovals = await prisma.user.count({ where: { status: 'PENDING' } });

  return (
    <AdminShell name={user.name} email={user.email} pendingApprovals={pendingApprovals}>
      {children}
    </AdminShell>
  );
}
