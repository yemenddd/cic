'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import AuthScreen, { type AuthScreenProps } from '@/components/platform/AuthScreen';

export default function LoginForm({
  conference,
}: {
  conference: AuthScreenProps['conference'];
}) {
  return (
    <AuthScreen
      heading="تسجيل الدخول"
      subheading="ادخل إلى لوحتك الشخصية في المؤتمر"
      submitIcon={LogIn}
      submitLabel="دخول"
      redirectTo="/dashboard"
      conference={conference}
      footer={
        <span style={{ color: 'var(--text-tertiary)' }}>
          <Link
            href="/forgot-password"
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            نسيت كلمة المرور؟
          </Link>
          <span className="mx-2" aria-hidden>·</span>
          ليس لديك حساب؟{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            سجّل الآن
          </Link>
        </span>
      }
    />
  );
}
