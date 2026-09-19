import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/platform/AuthCard';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'استعادة كلمة المرور | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      heading="استعادة كلمة المرور"
      subheading="أدخل بريدك الإلكتروني وسنرسل إليك رابطاً لاختيار كلمة مرور جديدة."
      footer={
        <>
          تذكّرتها؟{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            عُد لتسجيل الدخول
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
