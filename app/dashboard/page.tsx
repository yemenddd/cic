import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  IdCard, Lightbulb, ArrowLeft, CircleCheck, Bell, UserCheck, Clock,
  HandHeart, MapPin,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import {
  categoryLabel, categoryFeatures, abilitiesFor,
  MAX_SUBMISSIONS_PER_ATTENDEE, MAX_SHIFTS_PER_VOLUNTEER,
} from '@/lib/categories';
import { relativeArabicDate } from '@/lib/relative-time';
import { arabicCountBare, PROJECT, SHIFT } from '@/lib/arabic-plural';
import { byStartTime } from '@/lib/volunteering';
import { committeeLabel } from '@/lib/committees';
import {
  SUBMISSION_STATUS_COLORS, SUBMISSION_STATUS_LABELS, SUBMISSION_STATUSES,
} from '@/lib/submissions';
import WelcomeHero from './WelcomeHero';
import Readiness, { type ReadinessStep } from './Readiness';
import StatRings, { type RingStat } from './StatRings';
import StatusBar from './StatusBar';

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
  const [user, unreadNotifications, attendedCount, checkpointCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        category: true,
        confirmationCode: true,
        _count: { select: { submissions: true, volunteerShifts: true } },
        submissions: { select: { status: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id, read: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.attendance.count({ where: { userId: session.user.id } }),
    prisma.checkpoint.count(),
  ]);

  if (!user) redirect('/login');

  const firstName = (user.name ?? '').trim().split(/\s+/)[0] || 'بك';
  const category = categoryLabel(user.category, 'ar');
  // Each category's dashboard shows only what that category is entitled to,
  // and the benefit list is the same one advertised at registration.
  const abilities = abilitiesFor(user.category);
  const benefits = categoryFeatures(user.category, 'ar');

  const submissionCount = user._count.submissions;
  const shiftCount = user._count.volunteerShifts;

  // Only for the people who have a rota at all. Queried after the category is
  // known rather than alongside everything else: for the other two categories
  // the answer is always "none", and asking anyway would put a query on every
  // attendee's dashboard to render nothing.
  const nextShift = abilities.volunteerShifts && shiftCount > 0
    ? byStartTime(
        (
          await prisma.volunteerAssignment.findMany({
            where: { userId: session.user.id },
            select: {
              shift: {
                select: { id: true, titleAr: true, committee: true, day: true, startTime: true, endTime: true, location: true },
              },
            },
          })
        ).map((a) => a.shift),
        // Ordered by the same helper the rota page uses, so "next" means the
        // same thing in both places.
      )[0] ?? null
    : null;

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
      desc: user.confirmationCode ? 'احتفظ بها على هاتفك' : 'ستصدر بعد تأكيد التسجيل',
      href: '/dashboard/badge',
      icon: IdCard,
      done: Boolean(user.confirmationCode),
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
    // The rota is the volunteer tier's whole point, so for a volunteer this is
    // the step that matters most — and the one nobody else sees.
    ...(abilities.volunteerShifts
      ? [
          {
            key: 'volunteering',
            title: 'اخترت فترات تطوّعك',
            desc:
              shiftCount > 0
                ? `${arabicCountBare(shiftCount, SHIFT)} في جدول التطوّع`
                : 'اختر الفترات التي ستعمل فيها مع فريق التنظيم',
            href: '/dashboard/volunteering',
            icon: HandHeart,
            done: shiftCount > 0,
          },
        ]
      : []),
  ];

  // Counted from the statuses already loaded rather than a second query.
  const statusCounts = new Map<string, number>();
  for (const s of user.submissions) {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1);
  }

  // --- what the charts are drawn from ---------------------------------------

  // A ring has to be a measurement of something that has happened. An empty
  // one is not "0%", it is "nothing to show yet" — and a row of empty rings is
  // the exact fault the welcome hero was rebuilt to remove, three stat cards
  // two of which read zero on a new account. So a ring appears when it has
  // something to say, and until then the readiness steps and the timeline
  // below are what ask for the action.
  const rings: RingStat[] = [
    ...(abilities.submitInnovations
      ? [
          {
            key: 'projects',
            value: submissionCount,
            total: MAX_SUBMISSIONS_PER_ATTENDEE,
            label: 'مشاريعك',
            caption: `${arabicCountBare(submissionCount, PROJECT)} قيد المتابعة`,
            href: '/dashboard/innovations',
            color: 'var(--accent-violet)',
            ariaLabel: `قدّمت ${submissionCount} مشروعاً من أصل ${MAX_SUBMISSIONS_PER_ATTENDEE} مسموح بها`,
          },
        ]
      : []),
    ...(abilities.volunteerShifts
      ? [
          {
            key: 'shifts',
            value: shiftCount,
            total: MAX_SHIFTS_PER_VOLUNTEER,
            label: 'تطوّعك',
            caption: `${arabicCountBare(shiftCount, SHIFT)} في جدول التطوّع`,
            href: '/dashboard/volunteering',
            color: 'var(--accent-violet)',
            ariaLabel: `سجّلت في ${shiftCount} فترة تطوّع من أصل ${MAX_SHIFTS_PER_VOLUNTEER} مسموح بها`,
          },
        ]
      : []),
    // Only where there is a door to have walked through.
    ...(checkpointCount > 0
      ? [
          {
            key: 'attendance',
            value: attendedCount,
            total: checkpointCount,
            label: 'حضورك',
            caption: 'يُسجَّل حضورك بمسح رمز بطاقتك عند البوابة',
            href: '/dashboard/badge',
            color: 'var(--accent-blue)',
            ariaLabel: `سُجّل حضورك في ${attendedCount} من ${checkpointCount} بوابات`,
          },
        ]
      : []),
  ].filter((r) => r.value > 0);

  const statusSlices = SUBMISSION_STATUSES.map((status) => ({
    key: status,
    label: SUBMISSION_STATUS_LABELS[status],
    count: statusCounts.get(status) ?? 0,
    color: SUBMISSION_STATUS_COLORS[status],
  }));

  return (
    <div dir="rtl" className="space-y-5">
      <WelcomeHero
        firstName={firstName}
        category={category}
        code={user.confirmationCode}
      />

      <StatRings stats={rings} />

      <Readiness steps={steps} />

      {/* The volunteer's own next duty, above the programme: on the morning
          itself this is the one line they need, and it is not in the agenda —
          the agenda is what they would be watching if they were not working. */}
      {nextShift && (
        <Card>
          <CardHeading title="فترة تطوّعك القادمة" href="/dashboard/volunteering" linkLabel="جدول التطوّع" />

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
              style={{
                background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)',
                color: 'var(--accent-violet)',
              }}
            >
              {DAY_LABELS[nextShift.day] ?? nextShift.day}
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[12px] tabular-nums"
              dir="ltr"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Clock className="h-3.5 w-3.5" />
              {nextShift.startTime} — {nextShift.endTime}
            </span>
            {nextShift.location && (
              <span
                className="inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <MapPin className="h-3.5 w-3.5" />
                {nextShift.location}
              </span>
            )}
          </div>

          <p
            className="mt-3 font-outfit font-bold text-[15px] leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {nextShift.titleAr}
          </p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {committeeLabel(nextShift.committee)}
            {shiftCount > 1 && ` · و${arabicCountBare(shiftCount - 1, SHIFT)} أخرى في جدولك`}
          </p>
        </Card>
      )}

      {/* كانت هنا خريطة اليومين وبطاقة «جلستك القادمة». برنامج الدورة
          المنعقدة انتهى، وصفحة الجدول حُذفت معه — فما بقي هو ما لا يتقادم:
          الإشعارات وحالة ما قدّمه العضو. */}
      <div className="grid gap-5">
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
              <CardHeading title="حالة مشاريعك" href="/dashboard/innovations" linkLabel="أعمالي" />
              {/* Ordered by the workflow, not by however the counts came back
                  from the map — the bar reads as a pipeline, so draft has to
                  sit before review and review before a decision. */}
              <StatusBar slices={statusSlices} />
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
