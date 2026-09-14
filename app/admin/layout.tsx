import type { Metadata } from 'next';
import { auth } from '@/auth';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'لوحة تحكم CICT',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // /admin/login renders its own full-screen layout — proxy.ts already
  // handles the redirect logic, this just skips wrapping it in the shell.
  if (!session) return children;

  return <AdminShell email={session.user?.email}>{children}</AdminShell>;
}
