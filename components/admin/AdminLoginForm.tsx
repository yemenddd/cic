'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import AuthScreen, { type AuthScreenProps } from '@/components/platform/AuthScreen';

// Thin wrapper: everything that is not the wording or the destination lives in
// AuthScreen, so the two sign-in screens cannot drift apart again.
export default function AdminLoginForm({
  conference,
}: {
  conference: AuthScreenProps['conference'];
}) {
  return (
    <AuthScreen
      heading="لوحة تحكم CICT"
      subheading="سجّل الدخول لإدارة المؤتمر"
      submitIcon={Lock}
      submitLabel="دخول"
      redirectTo="/admin"
      conference={conference}
      footer={
        // The attendee sign-in has carried this since password recovery was
        // built; this screen was left without a footer at all, so an organizer
        // who forgot their password had no route back except asking another
        // admin to reset it — and if they were the only admin, none.
        //
        // No "create an account" line beside it, unlike the attendee screen:
        // there is no self-serve way to become an admin, and offering one
        // would be a dead end.
        <Link
          href="/forgot-password"
          className="font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          نسيت كلمة المرور؟
        </Link>
      }
    />
  );
}
