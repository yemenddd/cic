import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { TextField } from '@/components/admin/fields';
import AccountForm from '@/components/dashboard/AccountForm';
import { categoryLabel } from '@/lib/categories';
import { updateProfile, changePassword } from './actions';

export const metadata: Metadata = {
  title: 'حسابي | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  const email = session?.user?.email;
  // proxy.ts already gates /dashboard/*; this is the type-narrowing backstop.
  if (!email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect('/login');

  const category = categoryLabel(user.category, 'ar');

  return (
    <div className="max-w-lg">
      <h1 className="font-outfit font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
        حسابي
      </h1>

      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <p className="text-[12.5px] mb-1" style={{ color: 'var(--text-tertiary)' }}>
          البريد الإلكتروني للحساب
        </p>
        <p className="text-[14px] font-medium" dir="ltr" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
          {user.email}
        </p>
        <p className="mt-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          لا يمكن تغيير البريد الإلكتروني
          {category ? ` • نوع التسجيل: ${category}` : ''}
        </p>
      </div>

      <div className="space-y-6">
        <AccountForm
          title="البيانات الشخصية"
          action={updateProfile}
          submitLabel="حفظ البيانات"
        >
          <TextField name="name" label="الاسم الكامل" defaultValue={user.name} required />
          <TextField name="phone" label="رقم الهاتف" defaultValue={user.phone} type="tel" dir="ltr" />
          <TextField name="country" label="الدولة" defaultValue={user.country} />
          <TextField name="organization" label="الجهة / المؤسسة" defaultValue={user.organization} />
        </AccountForm>

        <AccountForm
          title="تغيير كلمة المرور"
          description="10 أحرف على الأقل"
          action={changePassword}
          submitLabel="تحديث كلمة المرور"
        >
          <TextField name="current" label="كلمة المرور الحالية" type="password" required dir="ltr" />
          <TextField name="next" label="كلمة المرور الجديدة" type="password" required dir="ltr" />
          <TextField name="confirm" label="تأكيد كلمة المرور الجديدة" type="password" required dir="ltr" />
        </AccountForm>
      </div>
    </div>
  );
}
