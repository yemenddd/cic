import type { Metadata } from 'next';
import LoginForm from '@/components/dashboard/LoginForm';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
