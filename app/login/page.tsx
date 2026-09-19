import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth-guards';
import { conferenceDisplay } from '@/lib/conference-display';
import LoginForm from '@/components/dashboard/LoginForm';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Checked against the database rather than the session: a deleted account
  // keeps a valid-looking token, and bouncing it to /dashboard — which would
  // bounce it right back here — is a loop.
  const user = await currentUser();
  if (user) redirect(user.role === 'ADMIN' ? '/admin' : '/dashboard');

  return <LoginForm conference={conferenceDisplay()} />;
}
