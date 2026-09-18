import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Lock, ShieldCheck, QrCode, Mail, BadgeCheck } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { TextField, SelectField } from '@/components/admin/fields';
import AccountForm from '@/components/dashboard/AccountForm';
import { categoryLabel } from '@/lib/categories';
import { SUBMISSION_TRACKS } from '@/lib/submissions';
import { updateProfile, changePassword } from './actions';

export const metadata: Metadata = {
  title: 'بياناتي | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

/** A value the attendee cannot change here, with the reason why. */
function FixedField({
  icon: Icon,
  label,
  value,
  note,
  mono,
}: {
  icon: typeof Lock;
  label: string;
  value: string;
  note: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--mat-liquid-bg)' }}
      >
        <Icon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-[13px] font-semibold"
          style={{
            color: 'var(--text-primary)',
            fontFamily: mono ? 'monospace' : undefined,
            letterSpacing: mono ? '0.06em' : undefined,
          }}
          dir={mono ? 'ltr' : undefined}
        >
          {value}
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {note}
        </p>
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const session = await auth();
  const email = session?.user?.email;
  // proxy.ts already gates /dashboard/*; this is the type-narrowing backstop.
  if (!email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect('/login');

  const category = categoryLabel(user.category, 'ar');
  const initial = (user.name?.trim() || user.email).charAt(0).toUpperCase();

  // The stored track is offered even when it predates the current list, so
  // opening this page can never quietly drop it from the certificate.
  const trackOptions = [
    { value: '', label: 'غير محدد' },
    ...SUBMISSION_TRACKS.map((t) => ({ value: t, label: t })),
    ...(user.track && !SUBMISSION_TRACKS.includes(user.track)
      ? [{ value: user.track, label: user.track }]
      : []),
  ];

  return (
    <div dir="rtl" className="space-y-5">
      <div>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          بياناتي
        </h1>
        <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
          هذه البيانات هي التي تُطبع على بطاقتك وشهادتك، فراجعها قبل المؤتمر.
        </p>
      </div>

      {/* Who this account is. */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -start-16 h-56 w-56 rounded-full"
          style={{ background: 'var(--hero-wash)' }}
        />

        <div className="relative flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[20px] font-bold"
            style={{ background: 'var(--gradient-brand)', color: '#fff' }}
          >
            {initial}
          </span>

          <div className="min-w-0">
            <p className="font-outfit font-bold text-[17px]" style={{ color: 'var(--text-primary)' }}>
              {user.name?.trim() || 'بلا اسم'}
            </p>
            <p className="mt-0.5 truncate text-[12.5px]" dir="ltr" style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}>
              {user.email}
            </p>
          </div>

          {category && (
            <span
              className="ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{
                background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)',
                color: 'var(--accent-violet)',
              }}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              {category}
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <AccountForm
          title="البيانات الشخصية"
          description="الاسم والمسار يظهران على شهادتك."
          action={updateProfile}
          submitLabel="حفظ البيانات"
        >
          <TextField name="name" label="الاسم الكامل" defaultValue={user.name} required />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="phone" label="رقم الهاتف" defaultValue={user.phone} type="tel" dir="ltr" />
            <TextField name="country" label="الدولة" defaultValue={user.country} />
          </div>

          <TextField name="organization" label="الجهة / المؤسسة" defaultValue={user.organization} />

          {/* Added because the certificate prints the track and its preview
              sends attendees here to correct their details — without this the
              page could not honour that. */}
          <SelectField
            name="track"
            label="المسار"
            defaultValue={user.track ?? ''}
            options={trackOptions}
          />
        </AccountForm>

        <div className="space-y-5">
          <AccountForm
            title="تغيير كلمة المرور"
            description="10 أحرف على الأقل."
            action={changePassword}
            submitLabel="تحديث كلمة المرور"
          >
            <TextField name="current" label="كلمة المرور الحالية" type="password" required dir="ltr" />
            <TextField name="next" label="كلمة المرور الجديدة" type="password" required dir="ltr" />
            <TextField name="confirm" label="تأكيد كلمة المرور الجديدة" type="password" required dir="ltr" />
          </AccountForm>

          {/* The three values an attendee cannot edit, each said once with its
              reason — rather than one crowded line of small print. */}
          <section
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
              <h2 className="font-outfit font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                بيانات ثابتة
              </h2>
            </div>

            <FixedField
              icon={Mail}
              label="البريد الإلكتروني"
              value={user.email}
              note="هو معرّف دخولك للمنصة، ولا يمكن تغييره."
              mono
            />
            <FixedField
              icon={ShieldCheck}
              label="فئة التسجيل"
              value={category || 'غير محددة'}
              note="تحدَّد عند التسجيل وتضبط ما هو متاح لك — لتغييرها تواصل مع فريق المؤتمر."
            />
            <FixedField
              icon={QrCode}
              label="رمز التأكيد"
              value={user.confirmationCode ?? 'يصدر بعد اعتماد التسجيل'}
              note="يظهر على بطاقتك وشهادتك، وهو ما يرجع إليه الفريق عند الاستفسار."
              mono={Boolean(user.confirmationCode)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
