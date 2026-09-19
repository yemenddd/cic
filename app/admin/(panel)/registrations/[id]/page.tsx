import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CircleAlert, TriangleAlert, UserCheck } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { dayLabel } from '@/lib/attendance';
import RegistrationActions from './RegistrationActions';

const STAMP = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'long', timeStyle: 'short' });

function Field({ label, value, dir }: { label: string; value?: string | null; dir?: 'ltr' | 'rtl' }) {
  return (
    <div>
      <p className="mb-1 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }} dir={dir}>
        {value || '—'}
      </p>
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: string;
  icon: typeof TriangleAlert;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: `color-mix(in srgb, ${tone} 9%, var(--bg-elevated))`,
        border: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
      }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tone }} />
      <div className="min-w-0 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </div>
    </div>
  );
}

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, role: true, category: true,
          confirmationCode: true, createdAt: true,
          attendance: {
            orderBy: { checkedInAt: 'desc' },
            select: { id: true, checkedInAt: true, checkpoint: { select: { nameAr: true, day: true } } },
          },
          _count: { select: { submissions: true, savedSessions: true } },
        },
      },
    },
  });
  if (!registration) notFound();

  // Other registrations sharing this address. Nothing stops the public form
  // being filled in twice, and two rows for one person inflates every headcount
  // the organizers plan catering and seating from.
  const duplicates = await prisma.registration.findMany({
    where: { email: registration.email, id: { not: registration.id } },
    orderBy: { submittedAt: 'desc' },
    select: { id: true, submittedAt: true, category: true, userId: true },
  });

  // An account exists for this address but was never attached to this row —
  // which is the state that makes the same person look like two people.
  const unlinkedAccount =
    !registration.userId
      ? await prisma.user.findUnique({
          where: { email: registration.email.toLowerCase() },
          select: { id: true },
        })
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/registrations" style={{ color: 'var(--text-tertiary)' }} aria-label="رجوع">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          {registration.fullName}
        </h1>
        {registration.user ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{
              color: 'var(--accent-cyan)',
              background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)',
            }}
          >
            <UserCheck className="h-3 w-3" />
            له حساب
          </span>
        ) : (
          <span
            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{
              color: 'var(--accent-violet)',
              background: 'color-mix(in srgb, var(--accent-violet) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)',
            }}
          >
            بلا حساب
          </span>
        )}
      </div>

      {unlinkedAccount && (
        <Banner tone="#f59e0b" icon={CircleAlert}>
          يوجد حساب بهذا البريد لكنه غير مرتبط بهذا التسجيل — ما يجعل الشخص نفسه يظهر كشخصين في
          الإحصاءات. اضغط «أنشئ حساباً لهذا المسجَّل» بالأسفل وسيُربط بالحساب القائم دون إنشاء حساب جديد.
        </Banner>
      )}

      {duplicates.length > 0 && (
        <Banner tone="#f59e0b" icon={TriangleAlert}>
          هذا البريد مسجَّل {duplicates.length + 1} مرات. راجع النسخ الأخرى واحذف الزائد، فكل نسخة
          تُحتسب شخصاً في أعداد الحضور والضيافة:{' '}
          {duplicates.map((d, i) => (
            <span key={d.id}>
              {i > 0 && '، '}
              <Link
                href={`/admin/registrations/${d.id}`}
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                نسخة {STAMP.format(d.submittedAt)}
              </Link>
            </span>
          ))}
        </Banner>
      )}

      <div
        className="rounded-2xl p-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <Field label="الاسم الكامل" value={registration.fullName} />
        <Field label="البريد الإلكتروني" value={registration.email} dir="ltr" />
        <Field label="رقم الهاتف" value={registration.phone} dir="ltr" />
        <Field label="الدولة" value={registration.country} />
        <Field label="الجهة" value={registration.organization} />
        <Field label="الفئة" value={categoryLabel(registration.category, 'ar') || registration.category} />
        <Field label="المسار" value={registration.track} />
        <Field label="رمز التأكيد" value={registration.confirmationCode} dir="ltr" />
        <Field label="وقت التسجيل" value={STAMP.format(registration.submittedAt)} />
      </div>

      {registration.user && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
            الحساب المرتبط
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="اسم الحساب" value={registration.user.name} />
            <Field label="بريد الحساب" value={registration.user.email} dir="ltr" />
            <Field label="فئة الحساب" value={categoryLabel(registration.user.category, 'ar')} />
            <Field
              label="النشاط"
              value={`${registration.user._count.submissions} ابتكار · ${registration.user._count.savedSessions} جلسة محفوظة`}
            />
          </div>

          {/* The question actually asked on the day: did this person turn up? */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
            <p className="mb-2 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              الحضور
            </p>
            {registration.user.attendance.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                لم يُسجَّل حضوره في أي نقطة بعد.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {registration.user.attendance.map((a) => (
                  <li key={a.id} className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    {a.checkpoint.nameAr} · {dayLabel(a.checkpoint.day)} · {STAMP.format(a.checkedInAt)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* The registration's own email is what the account was made from, so
              a later change to one of them makes the pair quietly disagree. */}
          {registration.user.email.toLowerCase() !== registration.email.toLowerCase() && (
            <Banner tone="#f59e0b" icon={CircleAlert}>
              بريد الحساب يختلف عن بريد التسجيل. رسائل المنصة تذهب إلى بريد الحساب، لا إلى المكتوب هنا.
            </Banner>
          )}
        </div>
      )}

      <RegistrationActions
        registrationId={registration.id}
        hasAccount={Boolean(registration.userId)}
        accountId={registration.userId}
      />
    </div>
  );
}
