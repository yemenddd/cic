import type { Metadata } from 'next';
import Link from 'next/link';
import AuthCard from '@/components/platform/AuthCard';
import { checkResetToken } from '@/lib/password-reset';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'كلمة مرور جديدة | مؤتمر الإبداع والابتكار',
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // Checked before the form is drawn, so somebody holding a stale link is told
  // so immediately rather than after typing a password twice.
  const state = await checkResetToken(token ?? '');

  if (!state.valid) {
    return (
      <AuthCard
        heading="الرابط لم يعد صالحاً"
        subheading="روابط إعادة التعيين تعمل مرة واحدة فقط، وتنتهي صلاحيتها بعد ساعة."
        footer={
          <Link href="/login" className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            العودة لتسجيل الدخول
          </Link>
        }
      >
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-[14px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          اطلب رابطاً جديداً
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="كلمة مرور جديدة"
      subheading="اختر كلمة مرور جديدة لحسابك. ستُستخدم في تسجيل الدخول من الآن فصاعداً."
    >
      <ResetPasswordForm token={token ?? ''} />
    </AuthCard>
  );
}
