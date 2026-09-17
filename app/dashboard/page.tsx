import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  IdCard, CalendarDays, Lightbulb, ArrowLeft, CircleCheck, Clock, FileText, Bell,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel, categoryFeatures, abilitiesFor } from '@/lib/categories';

const NEXT_STEPS = [
  {
    href: '/dashboard/badge',
    icon: IdCard,
    title: 'حمّل بطاقة المؤتمر',
    desc: 'بطاقتك الدائمة برمز التأكيد — احملها معك يوم الحضور.',
  },
  {
    href: '/dashboard/agenda',
    icon: CalendarDays,
    title: 'ابنِ جدولك الخاص',
    desc: 'احفظ الجلسات التي تهمّك من البرنامج لتجدها كلها في مكان واحد.',
  },
  {
    href: '/dashboard/innovations',
    icon: Lightbulb,
    title: 'شارك ابتكارك',
    desc: 'أرسل مشروعك إلى لجنة التحكيم وتابع حالة المراجعة أولًا بأول.',
    requires: 'submitInnovations' as const,
  },
];

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Deliberately un-wrapped by safe(): this is the attendee's own data, and a
  // DB outage must surface as an error rather than an empty "you have nothing".
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      category: true,
      track: true,
      organization: true,
      confirmationCode: true,
      _count: { select: { savedSessions: true, submissions: true } },
      submissions: { select: { status: true } },
    },
  });

  if (!user) redirect('/login');

  // The latest few unread notifications, so a committee decision shows up on the
  // overview instead of waiting to be discovered on the notifications page.
  const unreadNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id, read: false },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const firstName = (user.name ?? '').trim().split(/\s+/)[0] || 'بك';
  const category = categoryLabel(user.category, 'ar');
  // Each category's dashboard shows only what that category is entitled to,
  // and the benefit list is the same one advertised at registration.
  const abilities = abilitiesFor(user.category);
  const benefits = categoryFeatures(user.category, 'ar');
  const nextSteps = NEXT_STEPS.filter((s) => !s.requires || abilities[s.requires]);
  const approved = user.submissions.filter((s) => s.status === 'APPROVED').length;
  const inReview = user.submissions.filter(
    (s) => s.status === 'PENDING' || s.status === 'UNDER_REVIEW',
  ).length;
  const drafts = user.submissions.filter((s) => s.status === 'DRAFT').length;

  const stats = [
    {
      href: '/dashboard/badge',
      icon: IdCard,
      label: 'رمز بطاقتك',
      value: user.confirmationCode ?? '—',
      hint: user.confirmationCode ? 'اعرض بطاقتك' : 'سيظهر الرمز بعد تأكيد تسجيلك',
      mono: true,
    },
    {
      href: '/dashboard/agenda',
      icon: CalendarDays,
      label: 'الجلسات المحفوظة',
      value: String(user._count.savedSessions),
      hint: user._count.savedSessions ? 'اعرض جدولك' : 'لم تحفظ أي جلسة بعد',
    },
    ...(abilities.submitInnovations
      ? [{
          href: '/dashboard/innovations',
          icon: Lightbulb,
          label: 'ابتكاراتك',
          value: String(user._count.submissions),
          hint: user._count.submissions ? 'تابع حالة مشاريعك' : 'لم ترسل أي مشروع بعد',
        }]
      : []),
  ];

  const submissionChips = [
    { icon: CircleCheck, label: 'مقبول', count: approved },
    { icon: Clock, label: 'قيد المراجعة', count: inReview },
    { icon: FileText, label: 'مسودة', count: drafts },
  ].filter((c) => c.count > 0);

  return (
    <div dir="rtl">
      {/* Welcome */}
      <section
        className="rounded-2xl p-6 md:p-7 mb-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <p className="text-[12.5px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
          مؤتمر الإبداع والابتكار · النسخة الرابعة 2026
        </p>
        <h1 className="font-outfit font-bold text-2xl md:text-[28px]" style={{ color: 'var(--text-primary)' }}>
          أهلًا {firstName} 👋
        </h1>
        <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          هذه مساحتك الخاصة في المؤتمر — بطاقتك، وجدولك، ومشاريعك، كلها هنا.
        </p>

        {(category || user.track || user.organization) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {[category, user.track, user.organization]
              .filter((v): v is string => Boolean(v))
              .map((v) => (
                <span
                  key={v}
                  className="rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{
                    background: 'var(--mat-liquid-bg)',
                    border: '1px solid var(--mat-liquid-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {v}
                </span>
              ))}
          </div>
        )}
      </section>

      {/* Unread notifications — only when there is something new to read */}
      {unreadNotifications.length > 0 && (
        <section
          className="rounded-2xl p-5 md:p-6 mb-6"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2
              className="font-outfit font-bold text-[15px] flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Bell className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              إشعارات جديدة
            </h2>
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              كل الإشعارات
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {unreadNotifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '/dashboard/notifications'}
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={{
                  background: 'var(--mat-liquid-bg)',
                  border: '1px solid var(--mat-liquid-border)',
                }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: 'var(--primary)' }}
                  aria-label="غير مقروء"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  {n.body && (
                    <span
                      className="mt-1 block text-[12.5px] leading-relaxed line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {n.body}
                    </span>
                  )}
                  <span className="mt-1.5 block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(n.createdAt).toLocaleDateString('ar')}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ href, icon: Icon, label, value, hint, mono }) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <Icon className="h-5 w-5 mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p
              className="font-outfit font-bold text-2xl break-all"
              style={{
                color: 'var(--text-primary)',
                fontFamily: mono ? 'monospace' : undefined,
                letterSpacing: mono ? '0.08em' : undefined,
              }}
              dir={mono ? 'ltr' : undefined}
            >
              {value}
            </p>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
            <p className="text-[11.5px] mt-2" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
          </Link>
        ))}
      </div>

      {/* Submission status summary — only when there is something to summarize */}
      {submissionChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>حالة مشاريعك:</span>
          {submissionChips.map(({ icon: Icon, label, count }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label} · {count}
            </span>
          ))}
        </div>
      )}

      {/* What this attendee's category actually includes */}
      {benefits.length > 0 && (
        <>
          <h2 className="font-outfit font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
            {category ? `مزايا فئتك · ${category}` : 'مزاياك'}
          </h2>
          <ul
            className="mb-8 rounded-2xl p-5 space-y-2.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>
                <CircleCheck className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                {b}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Next steps */}
      <h2 className="font-outfit font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
        الخطوات التالية
      </h2>
      <div className="space-y-3">
        {nextSteps.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl p-4 md:p-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-primary)' }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </span>
              <span className="block text-[12.5px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {desc}
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
