import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  IdCard, CalendarDays, Lightbulb, ArrowLeft, CircleCheck, Bell, UserCheck, Sparkles, Clock,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel, categoryFeatures, abilitiesFor } from '@/lib/categories';
import { resolveSessionInterval } from '@/lib/ics';
import { relativeArabicDate } from '@/lib/relative-time';
import { arabicCountBare, SESSION, PROJECT } from '@/lib/arabic-plural';
import { SUBMISSION_STATUS_COLORS, SUBMISSION_STATUS_LABELS } from '@/lib/submissions';
import WelcomeHero from './WelcomeHero';
import Readiness, { type ReadinessStep } from './Readiness';

const DAY_LABELS: Record<string, string> = {
  dayOne: 'اليوم الأول',
  dayTwo: 'اليوم الثاني',
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {children}
    </section>
  );
}

function CardHeading({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[12px] font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      >
        {linkLabel}
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Deliberately un-wrapped by safe(): this is the attendee's own data, and a
  // DB outage must surface as an error rather than an empty "you have nothing".
  const [user, unreadNotifications, saved] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        category: true,
        confirmationCode: true,
        _count: { select: { savedSessions: true, submissions: true } },
        submissions: { select: { status: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.savedSession.findMany({
      where: { userId: session.user.id },
      select: {
        session: {
          select: { id: true, day: true, time: true, titleAr: true, speakerNameAr: true, trackAr: true },
        },
      },
    }),
  ]);

  if (!user) redirect('/login');

  const firstName = (user.name ?? '').trim().split(/\s+/)[0] || 'بك';
  const category = categoryLabel(user.category, 'ar');
  // Each category's dashboard shows only what that category is entitled to,
  // and the benefit list is the same one advertised at registration.
  const abilities = abilitiesFor(user.category);
  const benefits = categoryFeatures(user.category, 'ar');

  const savedCount = user._count.savedSessions;
  const submissionCount = user._count.submissions;

  // The soonest saved session, by the same resolver the .ics export uses — so
  // "next" here and the downloaded calendar can never disagree. Sessions whose
  // free-text time can't be parsed sort last rather than being guessed at.
  const upcoming = saved
    .map(({ session: s }) => ({ session: s, interval: resolveSessionInterval(s) }))
    .filter((row) => row.interval !== null)
    .sort((a, b) => a.interval!.start.getTime() - b.interval!.start.getTime())[0];

  const steps: ReadinessStep[] = [
    {
      key: 'account',
      title: 'أنشأت حسابك',
      desc: 'تم تأكيد تسجيلك في المنصة',
      href: '/dashboard/account',
      icon: UserCheck,
      done: true,
    },
    {
      key: 'badge',
      title: 'بطاقتك جاهزة',
      desc: user.confirmationCode ? 'حمّلها قبل يوم الحضور' : 'ستصدر بعد تأكيد التسجيل',
      href: '/dashboard/badge',
      icon: IdCard,
      done: Boolean(user.confirmationCode),
    },
    {
      key: 'agenda',
      title: 'جدولك الخاص',
      desc: savedCount > 0 ? `${arabicCountBare(savedCount, SESSION)} في جدولك` : 'احفظ الجلسات التي تهمّك',
      href: '/dashboard/agenda',
      icon: CalendarDays,
      done: savedCount > 0,
    },
    // Presenting a project is a participant benefit, so it is only a step for
    // the attendees who actually have it — see abilitiesFor() in lib/categories.
    ...(abilities.submitInnovations
      ? [
          {
            key: 'innovation',
            title: 'قدّمت مشروعك',
            desc:
              submissionCount > 0
                ? `${arabicCountBare(submissionCount, PROJECT)} قيد المتابعة`
                : 'اعرض بحثك أو ابتكارك على اللجنة',
            href: '/dashboard/innovations',
            icon: Lightbulb,
            done: submissionCount > 0,
          },
        ]
      : []),
  ];

  // Counted from the statuses already loaded rather than a second query.
  const statusCounts = new Map<string, number>();
  for (const s of user.submissions) {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
  }

  return (
    <div dir="rtl" className="space-y-5">
      <WelcomeHero
        firstName={firstName}
        category={category}
        code={user.confirmationCode}
      />

      <Readiness steps={steps} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Next session */}
        <Card>
          <CardHeading title="جلستك القادمة" href="/dashboard/agenda" linkLabel="جدولي" />

          {upcoming ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-cyan) 16%, transparent)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  {DAY_LABELS[upcoming.session.day] ?? upcoming.session.day}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-[12px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {upcoming.session.time}
                </span>
              </div>

              <p
                className="mt-3 font-outfit font-bold text-[15px] leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                {upcoming.session.titleAr}
              </p>

              {(upcoming.session.speakerNameAr || upcoming.session.trackAr) && (
                <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  {[upcoming.session.speakerNameAr, upcoming.session.trackAr]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}

              {savedCount > 1 && (
                <p className="mt-4 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                  و{arabicCountBare(savedCount - 1, SESSION)} أخرى في جدولك
                </p>
              )}
            </div>
          ) : (
            <div className="py-3">
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {savedCount > 0
                  ? 'جلساتك المحفوظة لم تُحدَّد أوقاتها بعد — ستظهر هنا فور جدولتها.'
                  : 'لم تحفظ أي جلسة بعد. تصفّح البرنامج واختر ما يهمّك ليصبح لك جدول خاص.'}
              </p>
              <Link
                href="/dashboard/agenda"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Sparkles className="h-4 w-4" />
                تصفّح البرنامج
              </Link>
            </div>
          )}
        </Card>

        {/* Notifications, or — when the feed is quiet — the project statuses */}
        <Card>
          {unreadNotifications.length > 0 ? (
            <>
              <CardHeading title="إشعارات جديدة" href="/dashboard/notifications" linkLabel="الكل" />
              <div className="space-y-2.5">
                {unreadNotifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? '/dashboard/notifications'}
                    className="platform-activity-row flex items-start gap-3 rounded-xl p-3"
                    style={{ border: '1px solid var(--mat-liquid-border)' }}
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: 'var(--accent-violet)' }}
                      aria-label="غير مقروء"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[13px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {n.title}
                      </span>
                      {n.body && (
                        <span
                          className="mt-1 block text-[12px] leading-relaxed line-clamp-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1.5 block text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {relativeArabicDate(n.createdAt)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : abilities.submitInnovations && submissionCount > 0 ? (
            <>
              <CardHeading title="حالة مشاريعك" href="/dashboard/innovations" linkLabel="ابتكاراتي" />
              <ul className="space-y-2.5">
                {[...statusCounts.entries()].map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            SUBMISSION_STATUS_COLORS[status as keyof typeof SUBMISSION_STATUS_COLORS],
                        }}
                      />
                      {SUBMISSION_STATUS_LABELS[status as keyof typeof SUBMISSION_STATUS_LABELS]}
                    </span>
                    <span className="font-outfit font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <CardHeading title="الإشعارات" href="/dashboard/notifications" linkLabel="الكل" />
              <div className="flex flex-col items-center py-6 text-center">
                <span
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--mat-liquid-bg)' }}
                >
                  <Bell className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                </span>
                <p className="text-[13px] leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                  لا جديد الآن. سنُعلمك هنا بأي تحديث يخص حضورك أو مشاريعك.
                </p>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* What this attendee's category actually includes */}
      {benefits.length > 0 && (
        <Card>
          <h2 className="mb-4 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
            {category ? `مزايا فئتك · ${category}` : 'مزاياك'}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 text-[13px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <CircleCheck
                  className="h-4 w-4 shrink-0 mt-0.5"
                  style={{ color: 'var(--accent-cyan)' }}
                />
                {b}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
