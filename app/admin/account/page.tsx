import { auth } from '@/auth';
import FormShell from '@/components/admin/FormShell';
import { TextField } from '@/components/admin/fields';
import { changePassword } from './actions';

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="max-w-lg">
      <FormShell
        title="تغيير كلمة المرور"
        backHref="/admin"
        action={changePassword}
        submitLabel="تحديث كلمة المرور"
      >
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
          {session?.user?.email}
        </p>
        <TextField name="current" label="كلمة المرور الحالية" type="password" required dir="ltr" />
        <TextField name="next" label="كلمة المرور الجديدة" type="password" required dir="ltr" />
        <TextField name="confirm" label="تأكيد كلمة المرور الجديدة" type="password" required dir="ltr" />
      </FormShell>
    </div>
  );
}
