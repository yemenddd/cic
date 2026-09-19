import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth-guards';
import { conferenceDisplay } from '@/lib/conference-display';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: 'تسجيل دخول الإدمن | CICT',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // proxy.ts leaves this page alone on purpose, so the "you're already signed
  // in" shortcut is decided here instead — from the database, so that someone
  // whose admin rights were revoked lands on their dashboard rather than
  // bouncing between a panel and a login form.
  const user = await currentUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');

  return <AdminLoginForm conference={conferenceDisplay()} />;
}
