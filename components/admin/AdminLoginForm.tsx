'use client';

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
    />
  );
}
