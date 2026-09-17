import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: 'حسابي | CICT 2026',
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // proxy.ts already guards /dashboard/*, but a page must never render
  // attendee data on the assumption that it ran.
  if (!session?.user) redirect('/login');

  // The shell is a client component, so the unread count is counted here (in a
  // Server Component) and passed down as a prop.
  const [unreadCount, profile] = await Promise.all([
    session.user.id
      ? prisma.notification.count({ where: { userId: session.user.id, read: false } })
      : Promise.resolve(0),
    session.user.id
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { category: true } })
      : Promise.resolve(null),
  ]);

  return (
    <DashboardShell
      name={session.user.name}
      email={session.user.email}
      unreadCount={unreadCount}
      category={profile?.category ?? null}
    >
      {children}
    </DashboardShell>
  );
}
