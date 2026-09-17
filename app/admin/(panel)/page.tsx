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
  ShieldCheck,
} from 'lucide-react';
import type { SubmissionStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import StatusChip from '@/components/submissions/StatusChip';
import { SUBMISSION_STATUSES, SUBMISSION_STATUS_LABELS } from '@/lib/submissions';
import { CATEGORIES, categoryLabel } from '@/lib/categories';

// Statuses that put a submission in front of the committee. Deliberately not
// REVIEW_STATUSES — that list is what a reviewer may *set* (it includes the
// already-decided APPROVED/REJECTED), which is the opposite of a work queue.
const ACTION_STATUSES: SubmissionStatus[] = ['PENDING', 'UNDER_REVIEW'];

// Reference inventory — no decision hangs on these, so they sit at the bottom.
const CONTENT_CARDS = [
  { href: '/admin/speakers', label: 'المتحدثون', icon: Mic2, count: () => prisma.speaker.count() },
  { href: '/admin/program', label: 'جلسات البرنامج', icon: CalendarDays, count: () => prisma.programSession.count() },
  { href: '/admin/gallery', label: 'صور المعرض', icon: Images, count: () => prisma.galleryImage.count() },
  { href: '/admin/partners', label: 'الشركاء', icon: Handshake, count: () => prisma.partner.count() },
  { href: '/admin/history', label: 'دورات المؤتمر', icon: History, count: () => prisma.historyEdition.count() },
  { href: '/admin/achievements', label: 'إنجازات الطلاب', icon: Trophy, count: () => prisma.achievementStudent.count() },
  { href: '/admin/videos', label: 'الفيديوهات', icon: Clapperboard, count: () => prisma.video.count() },
  { href: '/admin/registrations', label: 'التسجيلات', icon: ClipboardList, count: () => prisma.registration.count() },
];

const CARD_SURFACE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--mat-liquid-border)',
} as const;

function SectionHeading({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[12.5px] font-semibold"
        style={{ color: 'var(--text-secondary)' }}
      >
        {linkLabel}
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CountChip({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap"
      style={{
        background: 'var(--mat-liquid-bg)',
        border: '1px solid var(--mat-liquid-border)',
        color: 'var(--text-secondary)',
      }}
    >
      {label} · {count}
    </Link>
  );
}

export default async function AdminHomePage() {
  // One round of parallel queries: aggregates via groupBy instead of a count()
  // per status/category, plus the content inventory nested so the whole page
  // still fans out in a single Promise.all.
  const [statusGroups, latest, roleGroups, categoryGroups, contentCounts] = await Promise.all([
    prisma.projectSubmission.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.projectSubmission.findMany({
      // Matches the review queue's ordering, so "الأحدث" here means the same
      // rows that sit at the top of /admin/submissions.
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['category'], _count: { _all: true }, where: { role: 'ATTENDEE' } }),
    Promise.all(CONTENT_CARDS.map((c) => c.count())),
  ]);

  const statusCounts = Object.fromEntries(SUBMISSION_STATUSES.map((s) => [s, 0])) as Record<SubmissionStatus, number>;
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;

  const needsAction = ACTION_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);
  const totalSubmissions = SUBMISSION_STATUSES.reduce((sum, s) => sum + statusCounts[s], 0);

  const roleCounts: Record<UserRole, number> = { ADMIN: 0, ATTENDEE: 0 };
  for (const g of roleGroups) roleCounts[g.role] = g._count._all;

  const byCategory = new Map(categoryGroups.map((g) => [g.category ?? '', g._count._all]));
  const categoryRows = CATEGORIES.map((c) => ({
    key: c.id,
    label: categoryLabel(c.id, 'ar'),
    count: byCategory.get(c.id) ?? 0,
  }));
  // Anything the three known categories don't account for (null at signup, or
  // a value that predates the current list) still has to show up somewhere.
  const uncategorized = roleCounts.ATTENDEE - categoryRows.reduce((sum, r) => sum + r.count, 0);
  if (uncategorized > 0) categoryRows.push({ key: 'unknown', label: 'غير محدد', count: uncategorized });

  return (
    <div className="space-y-9">
      <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
        نظرة عامة
      </h1>

      {/* 1 — what needs a decision today */}
      {needsAction > 0 ? (
        <section
          className="rounded-2xl p-6"
          style={{
            background: 'color-mix(in srgb, var(--primary) 7%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--primary) 32%, transparent)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                <p className="text-[12.5px] font-semibold" style={{ color: 'var(--primary)' }}>
                  يحتاج إجراءً
                </p>
              </div>
              <p className="font-outfit font-bold text-4xl leading-none" style={{ color: 'var(--text-primary)' }}>
                {needsAction}
              </p>
              <p className="mt-2 text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>
                ابتكار بانتظار قرار لجنة المراجعة
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ACTION_STATUSES.map((s) => (
                  <CountChip
                    key={s}
                    href={`/admin/submissions?status=${s}`}
                    label={SUBMISSION_STATUS_LABELS[s]}
                    count={statusCounts[s]}
                  />
                ))}
              </div>
            </div>
            <Link
              href="/admin/submissions?status=PENDING"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              ابدأ المراجعة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section
          className="rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
          style={CARD_SURFACE}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <div>
              <p className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                لا شيء بانتظار المراجعة
              </p>
              <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                {totalSubmissions > 0
                  ? 'تمت معالجة كل الابتكارات التي وصلت حتى الآن.'
                  : 'لم يُقدَّم أي ابتكار بعد.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            كل الابتكارات
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* 2 — the last five things people sent in */}
      <section>
        <SectionHeading title="أحدث الابتكارات" href="/admin/submissions" linkLabel="كل الابتكارات" />

        <div className="mb-3 flex flex-wrap gap-2">
          {SUBMISSION_STATUSES.map((s) => (
            <CountChip
              key={s}
              href={`/admin/submissions?status=${s}`}
              label={SUBMISSION_STATUS_LABELS[s]}
              count={statusCounts[s]}
            />
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={CARD_SURFACE}>
          {latest.length === 0 ? (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              لا توجد ابتكارات مقدَّمة بعد
            </p>
          ) : (
            latest.map((s, i) => (
              <Link
                key={s.id}
                href={`/admin/submissions/${s.id}`}
                className="flex flex-wrap items-center gap-3 p-4"
                style={{ borderTop: i > 0 ? '1px solid var(--mat-liquid-border)' : undefined }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px]" style={{ color: 'var(--text-primary)' }}>
                    {s.titleAr}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {s.user.name || '—'} · <span dir="ltr">{s.user.email}</span>
                  </p>
                </div>
                <span className="text-[11.5px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(s.submittedAt ?? s.createdAt).toLocaleDateString('ar')}
                </span>
                <StatusChip status={s.status} />
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 3 — who signed up */}
      <section>
        <SectionHeading title="المستخدمون" href="/admin/users" linkLabel="إدارة المستخدمين" />
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/users" className="rounded-2xl p-5" style={CARD_SURFACE}>
            <Users className="mb-4 h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-outfit font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              {roleCounts.ATTENDEE}
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              حساب حاضر
            </p>
          </Link>

          <Link href="/admin/users" className="rounded-2xl p-5" style={CARD_SURFACE}>
            <ShieldCheck className="mb-4 h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-outfit font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              {roleCounts.ADMIN}
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              حساب مشرف
            </p>
          </Link>

          <div className="rounded-2xl p-5" style={CARD_SURFACE}>
            <p className="mb-3 text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              الحاضرون حسب الفئة
            </p>
            {roleCounts.ATTENDEE === 0 ? (
              <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
                لا يوجد حاضرون بعد
              </p>
            ) : (
              <ul className="space-y-2">
                {categoryRows.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-outfit font-bold" style={{ color: 'var(--text-primary)' }}>
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 4 — inventory, for reference */}
      <section>
        <h2 className="mb-3 font-outfit font-bold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          المحتوى
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CONTENT_CARDS.map(({ href, label, icon: Icon }, i) => (
            <Link key={href} href={href} className="rounded-2xl p-5" style={CARD_SURFACE}>
              <Icon className="mb-4 h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
              <p className="font-outfit font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                {contentCounts[i]}
              </p>
              <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
