import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { currentUser } from '@/lib/auth-guards';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'حسابي | CIC',
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Read from the database, not from the session: a deleted account still
  // carries a perfectly valid token, and the category shown in the nav can
  // have been changed by an admin since sign-in.
  const user = await currentUser();
  if (!user) redirect('/login');

  // An organizer has one account, and it is the organizer's.
  //
  // Nothing stopped an admin opening the attendee side, so every admin also
  // had a badge, a certificate, an agenda and a submissions quota — a second
  // identity nobody asked for, and one that would have turned up in the
  // attendance figures and the certificate list as if it were a participant.
  //
  // Decided here from the database rather than in proxy.ts, whose copy of the
  // role is written at sign-in and can be a month stale.
  if (user.role === 'ADMIN') redirect('/admin');

  // The shell is a client component, so the unread count is counted here (in a
  // Server Component) and passed down as a prop.
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <DashboardShell
      name={user.name}
      email={user.email}
      unreadCount={unreadCount}
      category={user.category}
    >
      {children}
    </DashboardShell>
  );
}
