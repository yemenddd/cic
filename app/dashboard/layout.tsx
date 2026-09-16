import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
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

  return (
    <DashboardShell name={session.user.name} email={session.user.email}>
      {children}
    </DashboardShell>
  );
}
