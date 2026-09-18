import Link from 'next/link';
import {
  Mic2,
  CalendarDays,
  Images,
  Handshake,
  History,
  Trophy,
  Clapperboard,
  ClipboardList,
  Inbox,
  CheckCircle2,
  ArrowLeft,
  Users,
  Lightbulb,
} from 'lucide-react';
import type { SubmissionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import StatCard from '@/components/admin/StatCard';
import { Panel } from '@/components/admin/Panel';
import BarList, { type BarItem } from '@/components/admin/BarList';
import {
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_COLORS,
  SUBMISSION_STATUS_LABELS,
} from '@/lib/submissions';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import OverviewHeader from './OverviewHeader';
import ActivityFeed, { FeedFooterLink, type ActivityItem } from './ActivityFeed';

// Statuses that put a submission in front of the committee. Deliberately not
// REVIEW_STATUSES — that list is what a reviewer may *set* (it includes the
// already-decided APPROVED/REJECTED), which is the opposite of a work queue.
const ACTION_STATUSES: SubmissionStatus[] = ['PENDING', 'UNDER_REVIEW'];

// Reference inventory. Nothing here needs a decision, so it is one dense panel
// at the foot of the page rather than eight cards the size of the numbers that
// do — the previous layout gave the least consequential section half the page.
const CONTENT_ITEMS = [
  { href: '/admin/speakers', label: 'المتحدثون', icon: Mic2, count: () => prisma.speaker.count() },
  { href: '/admin/program', label: 'جلسات البرنامج', icon: CalendarDays, count: () => prisma.programSession.count() },
  { href: '/admin/gallery', label: 'صور المعرض', icon: Images, count: () => prisma.galleryImage.count() },
  { href: '/admin/partners', label: 'الشركاء', icon: Handshake, count: () => prisma.partner.count() },
  { href: '/admin/history', label: 'دورات المؤتمر', icon: History, count: () => prisma.historyEdition.count() },
  { href: '/admin/achievements', label: 'إنجازات الطلاب', icon: Trophy, count: () => prisma.achievementStudent.count() },
  { href: '/admin/videos', label: 'الفيديوهات', icon: Clapperboard, count: () => prisma.video.count() },
  { href: '/admin/registrations', label: 'التسجيلات', icon: ClipboardList, count: () => prisma.registration.count() },
];

const CATEGORY_COLORS: Record<string, string> = {
  visitor: 'var(--accent-cyan)',
  participant: 'var(--accent-violet)',
  volunteer: 'var(--accent-blue)',
};

/** "+3 هذا الأسبوع" — omitted entirely at zero rather than shown as "+0". */
function weekHint(count: number): string | undefined {
  return count > 0 ? `+${count} خلال ٧ أيام` : undefined;
}

export default async function AdminHomePage() {
  // This page is rendered per request on the server, so reading the clock is
  // exactly right here — the "this week" counts mean nothing otherwise.
  // Written with new Date() rather than Date.now() arithmetic because the
  // purity lint treats the latter as a re-render hazard, which is a rule aimed
  // at client components.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);

  const [
    statusGroups,
    categoryGroups,
    attendeeCount,
    registrationCount,
    newAccounts,
    newRegistrations,
    newSubmissions,
    recentAccounts,
    recentSubmissions,
    recentAnnouncements,
    contentCounts,
  ] = await Promise.all([
    prisma.projectSubmission.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['category'], _count: { _all: true }, where: { role: 'ATTENDEE' } }),
    prisma.user.count({ where: { role: 'ATTENDEE' } }),
    prisma.registration.count(),
    prisma.user.count({ where: { role: 'ATTENDEE', createdAt: { gte: since } } }),
    prisma.registration.count({ where: { submittedAt: { gte: since } } }),
    prisma.projectSubmission.count({ where: { createdAt: { gte: since } } }),
    prisma.user.findMany({
      where: { role: 'ATTENDEE' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, email: true, category: true, createdAt: true },
    }),
    prisma.projectSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, title: true, recipients: true, createdAt: true },
    }),
    Promise.all(CONTENT_ITEMS.map((c) => c.count())),
  ]);

  const statusCounts = Object.fromEntries(
    SUBMISSION_STATUSES.map((s) => [s, 0]),
  ) as Record<SubmissionStatus, number>;
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;

  const needsAction = ACTION_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);
  const totalSubmissions = statusGroups.reduce((sum, g) => sum + g._count._all, 0);

  const byCategory = new Map(categoryGroups.map((g) => [g.category ?? '', g._count._all]));
  const categoryBars: BarItem[] = CATEGORIES.map((c) => ({
    label: categoryLabel(c.id, 'ar'),
    count: byCategory.get(c.id) ?? 0,
    color: CATEGORY_COLORS[c.id] ?? 'var(--accent-blue)',
  }));
  // Anything the three known categories don't account for (null at signup, or
  // a value that predates the current list) still has to show up somewhere.
  const uncategorized = attendeeCount - categoryBars.reduce((sum, r) => sum + r.count, 0);
  if (uncategorized > 0) {
    categoryBars.push({ label: 'غير محدد', count: uncategorized, color: 'var(--text-tertiary)' });
  }

  const statusBars: BarItem[] = SUBMISSION_STATUSES.map((s) => ({
    label: SUBMISSION_STATUS_LABELS[s],
    count: statusCounts[s],
    color: SUBMISSION_STATUS_COLORS[s],
  }));

  // Merged newest-first, then trimmed — so a quiet week of signups doesn't
  // crowd out a submission that arrived this morning.
  const activity: ActivityItem[] = [
    ...recentAccounts.map((u) => ({
      id: u.id,
      kind: 'account' as const,
      title: u.name || u.email,
      meta: categoryLabel(u.category, 'ar') || undefined,
      at: u.createdAt,
      href: `/admin/users/${u.id}`,
    })),
    ...recentSubmissions.map((s) => ({
      id: s.id,
      kind: 'submission' as const,
      title: s.titleAr,
      meta: s.user.name || s.user.email,
      at: s.submittedAt ?? s.createdAt,
      href: `/admin/submissions/${s.id}`,
    })),
    ...recentAnnouncements.map((a) => ({
      id: a.id,
      kind: 'announcement' as const,
      title: a.title,
      meta: `وصل إلى ${a.recipients} مشارك`,
      at: a.createdAt,
      href: '/admin/announcements',
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 7);

  return (
    <div className="space-y-7">
      <OverviewHeader />

      {/* The four numbers worth knowing before anything else. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="التسجيلات"
          value={registrationCount}
          icon={ClipboardList}
          hint={weekHint(newRegistrations)}
        />
        <StatCard label="الحاضرون" value={attendeeCount} icon={Users} hint={weekHint(newAccounts)} />
        <StatCard
          label="الابتكارات"
          value={totalSubmissions}
          icon={Lightbulb}
          hint={weekHint(newSubmissions)}
        />
        <StatCard
          label="بانتظار المراجعة"
          value={needsAction}
          icon={Inbox}
          // The only tile that asks for an action gets the colour; four tinted
          // tiles would spend the colour channel on decoration.
          accent={needsAction > 0 ? 'var(--accent-violet)' : undefined}
        />
      </div>

      {/* What needs a decision today. */}
      {needsAction > 0 ? (
        <section
          className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
          style={{
            background: 'color-mix(in srgb, var(--accent-violet) 8%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent-violet) 28%, transparent)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' }}
            >
              <Inbox className="h-5 w-5" style={{ color: 'var(--accent-violet)' }} />
            </span>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {needsAction} ابتكار بانتظار قرار اللجنة
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {ACTION_STATUSES.filter((s) => statusCounts[s] > 0)
                  .map((s) => `${SUBMISSION_STATUS_LABELS[s]}: ${statusCounts[s]}`)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <Link
            href="/admin/submissions?status=PENDING"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            ابدأ المراجعة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <section
          className="rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <p className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            {totalSubmissions > 0
              ? 'لا شيء بانتظار المراجعة — تمت معالجة كل الابتكارات.'
              : 'لا شيء بانتظار المراجعة — لم يُقدَّم أي ابتكار بعد.'}
          </p>
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            كل الابتكارات
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="آخر النشاط" caption="التسجيلات والابتكارات والإعلانات، الأحدث أولاً">
            <ActivityFeed items={activity} />
            {activity.length > 0 && <FeedFooterLink href="/admin/users" label="كل المستخدمين" />}
          </Panel>
        </div>

        {/* Two short panels stacked, so the narrow column matches the feed's
            height instead of leaving a column of empty page beside it. */}
        <div className="space-y-4">
          <Panel title="الحاضرون حسب الفئة" caption={`${attendeeCount} حساب`}>
            <BarList items={categoryBars} basis={attendeeCount} />
            <FeedFooterLink href="/admin/insights" label="الإحصاءات الكاملة" />
          </Panel>

          <Panel title="حالة الابتكارات" caption={`${totalSubmissions} مشروع`}>
            <BarList items={statusBars} basis={totalSubmissions} />
            <FeedFooterLink href="/admin/submissions" label="قائمة المراجعة" />
          </Panel>
        </div>
      </div>

      <Panel title="المحتوى" caption="ما هو منشور على الموقع العام">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CONTENT_ITEMS.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              className="platform-activity-row flex items-center gap-3 rounded-xl p-3"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              <span className="min-w-0">
                <span
                  className="block font-outfit font-bold text-[17px] leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {contentCounts[i]}
                </span>
                <span className="mt-1 block truncate text-[11.5px]" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
