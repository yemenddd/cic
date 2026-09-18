import type { SubmissionStatus } from '@prisma/client';
import { ClipboardList, Clock, Lightbulb, Users } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import {
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_COLORS,
  SUBMISSION_STATUS_LABELS,
} from '@/lib/submissions';
import StatCard from '@/components/admin/StatCard';
import { Panel, EmptyNote } from '@/components/admin/Panel';
import BarList, { type BarItem } from '@/components/admin/BarList';
import TimeBars from './TimeBars';
import { bucketByTime, topValues, type Slice } from './aggregate';

// Submitted, but the committee has not ruled yet. DRAFT is the attendee's own
// unfinished work and APPROVED/REJECTED are decided, so neither is a queue the
// organisers owe an answer to.
const AWAITING_DECISION: SubmissionStatus[] = ['PENDING', 'UNDER_REVIEW'];

// Identity colours, fixed per category id — never assigned by rank, so a
// category that overtakes another does not swap hues under the reader.
const CATEGORY_COLORS: Record<string, string> = {
  visitor: 'var(--accent-cyan)',
  participant: 'var(--accent-blue)',
  volunteer: 'var(--accent-violet)',
};

const TOP_N = 8;

const GRANULARITY_CAPTION = {
  day: 'كل عمود يمثل يوماً',
  week: 'كل عمود يمثل سبعة أيام',
  month: 'كل عمود يمثل شهراً',
};

export default async function AdminInsightsPage() {
  const [
    accountCount,
    registrationCount,
    submissionCount,
    awaitingCount,
    categoryGroups,
    countryGroups,
    organizationGroups,
    statusGroups,
    trackGroups,
    registrationDates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.projectSubmission.count(),
    prisma.projectSubmission.count({ where: { status: { in: AWAITING_DECISION } } }),
    // groupBy instead of a count() per value: one round trip per breakdown,
    // and adding a category or a country never adds a query.
    prisma.registration.groupBy({ by: ['category'], _count: true }),
    prisma.registration.groupBy({ by: ['country'], _count: true }),
    prisma.registration.groupBy({ by: ['organization'], _count: true }),
    prisma.projectSubmission.groupBy({ by: ['status'], _count: true }),
    prisma.projectSubmission.groupBy({ by: ['track'], _count: true }),
    // Only the column the time series is bucketed from.
    prisma.registration.findMany({ select: { submittedAt: true } }),
  ]);

  const categoryCounts = new Map(categoryGroups.map((g) => [g.category, g._count]));
  // The three known categories always appear in their canonical order, so a
  // category with no registrations reads as a real zero rather than going
  // missing. Anything else stored in the column (older or hand-edited rows) is
  // listed after them instead of being silently dropped from the total.
  const categoryItems: BarItem[] = [
    ...CATEGORIES.map((c) => ({
      label: categoryLabel(c.id, 'ar') || c.id,
      count: categoryCounts.get(c.id) ?? 0,
      color: CATEGORY_COLORS[c.id] ?? 'var(--text-tertiary)',
    })),
    ...categoryGroups
      .filter((g) => !CATEGORY_COLORS[g.category])
      .map((g) => ({ label: g.category, count: g._count, color: 'var(--text-tertiary)' })),
  ];

  const countries = topValues(
    countryGroups.map((g) => ({ value: g.country, count: g._count })),
    TOP_N,
  );
  const organizations = topValues(
    organizationGroups.map((g) => ({ value: g.organization, count: g._count })),
    TOP_N,
  );
  const tracks = topValues(
    trackGroups.map((g) => ({ value: g.track, count: g._count })),
    TOP_N,
  );

  const statusCounts = new Map(statusGroups.map((g) => [g.status, g._count]));
  const statusItems: BarItem[] = SUBMISSION_STATUSES.map((status) => ({
    label: SUBMISSION_STATUS_LABELS[status],
    count: statusCounts.get(status) ?? 0,
    color: SUBMISSION_STATUS_COLORS[status],
  }));

  const series = bucketByTime(registrationDates.map((r) => r.submittedAt));

  // A ranking's bars are drawn against the leader, not the total — otherwise
  // eight countries sharing a handful of registrations are all hairlines. Both
  // bases are guarded inside BarList, so zero rows never divide by zero.
  const leader = (items: { count: number }[]) => items.reduce((max, i) => Math.max(max, i.count), 0);

  // A ranking is one series, so every bar in it wears the same hue — colouring
  // each row differently would spend the colour channel restating the length.
  const paint = (items: Slice[], color: string): BarItem[] => items.map((item) => ({ ...item, color }));

  return (
    <div>
      <ListPageHeader title="الإحصاءات" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="الحسابات" value={accountCount} icon={Users} />
        <StatCard label="التسجيلات" value={registrationCount} icon={ClipboardList} />
        <StatCard label="الابتكارات المقدَّمة" value={submissionCount} icon={Lightbulb} />
        <StatCard
          label="بانتظار القرار"
          value={awaitingCount}
          icon={Clock}
          accent={SUBMISSION_STATUS_COLORS.UNDER_REVIEW}
          hint="قيد الانتظار أو قيد المراجعة"
        />
      </div>

      <div className="space-y-4">
        <Panel title="التسجيلات حسب الفئة" caption="النسبة من إجمالي التسجيلات">
          {registrationCount === 0 ? (
            <EmptyNote />
          ) : (
            <BarList items={categoryItems} basis={registrationCount} />
          )}
        </Panel>

        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="أبرز الدول" caption={`الأعلى تسجيلاً (حتى ${TOP_N})`}>
            <BarList items={paint(countries, 'var(--accent-cyan)')} basis={leader(countries)} />
          </Panel>

          <Panel title="أبرز الجهات" caption={`الأعلى تسجيلاً (حتى ${TOP_N})`}>
            <BarList items={paint(organizations, 'var(--accent-blue)')} basis={leader(organizations)} />
          </Panel>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Panel title="الابتكارات حسب الحالة" caption="النسبة من إجمالي الابتكارات">
            {submissionCount === 0 ? (
              <EmptyNote label="لا توجد ابتكارات بعد" />
            ) : (
              <BarList items={statusItems} basis={submissionCount} />
            )}
          </Panel>

          <Panel title="الابتكارات حسب المسار" caption={`الأكثر إقبالاً (حتى ${TOP_N})`}>
            <BarList items={paint(tracks, 'var(--accent-violet)')} basis={leader(tracks)} />
          </Panel>
        </div>

        <Panel title="التسجيلات عبر الزمن" caption={GRANULARITY_CAPTION[series.granularity]}>
          <TimeBars buckets={series.buckets} />
        </Panel>
      </div>
    </div>
  );
}
