import Link from 'next/link';
import { UserRoundCheck, Clock, CircleCheck, CircleX } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import { categoryLabel } from '@/lib/categories';
import { committeeLabel } from '@/lib/committees';
import { relativeArabicDate } from '@/lib/relative-time';
import ApplicantCard, { type Applicant } from './ApplicantCard';

// Applications arrive while this page is open, and a cached queue is one that
// says nobody is waiting when four people are.
export const dynamic = 'force-dynamic';

type View = 'pending' | 'rejected' | 'approved';

const VIEWS: Array<{ key: View; label: string; icon: typeof Clock }> = [
  { key: 'pending', label: 'بانتظار القرار', icon: Clock },
  { key: 'approved', label: 'مقبولون', icon: CircleCheck },
  { key: 'rejected', label: 'مرفوضون', icon: CircleX },
];

const STATUS_OF: Record<View, 'PENDING' | 'APPROVED' | 'REJECTED'> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

/** Whole days since a moment, floored — never negative on a clock skew. */
function daysSince(at: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - at.getTime()) / 86_400_000));
}

export default async function ApprovalsPage({
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view: View = rawView === 'rejected' || rawView === 'approved' ? rawView : 'pending';

  const [rows, counts] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: STATUS_OF[view],
        role: 'ATTENDEE',
        // The approved list would otherwise be every account on the platform,
        // 207 of which were admitted by a migration and decided nothing. Only
        // the ones a person actually ruled on are worth showing back.
        ...(view === 'approved' ? { statusChangedAt: { not: null }, statusNote: { not: null } } : {}),
      },
      orderBy: view === 'pending' ? { createdAt: 'asc' } : { statusChangedAt: 'desc' },
      take: 200,
      select: {
        id: true, name: true, email: true, phone: true, country: true, organization: true,
        category: true, track: true, committee: true, createdAt: true,
        status: true, statusNote: true,
      },
    }),
    prisma.user.groupBy({ by: ['status'], where: { role: 'ATTENDEE' }, _count: true }),
  ]);

  const countOf = (status: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    counts.find((c) => c.status === status)?._count ?? 0;

  const applicants: Applicant[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    country: u.country,
    organization: u.organization,
    categoryLabel: categoryLabel(u.category, 'ar') || '—',
    track: u.track,
    committeeLabel: committeeLabel(u.committee),
    // Formatted server-side so no Date crosses into the client component.
    registeredAt: relativeArabicDate(u.createdAt),
    waitedDays: daysSince(u.createdAt),
    status: u.status,
    statusNote: u.statusNote,
  }));

  return (
    <div className="max-w-3xl">
      <ListPageHeader
        title="طلبات الانضمام"
        description="المشاركون والمتطوعون يُنشئون حساباتهم فوراً ولا يدخلونها حتى تقبلوها. الزوار يدخلون مباشرة."
      />

      <div
        className="mb-5 inline-flex rounded-xl p-1"
        style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
      >
        {VIEWS.map((tab) => {
          const active = tab.key === view;
          const count = countOf(STATUS_OF[tab.key]);
          return (
            <Link
              key={tab.key}
              href={`/admin/approvals?view=${tab.key}`}
              aria-current={active ? 'page' : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={{
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: active ? 'var(--shadow-sm)' : undefined,
              }}
            >
              <tab.icon className="h-3.5 w-3.5" aria-hidden />
              {tab.label}
              {tab.key === 'pending' && count > 0 && (
                <span className="tabular-nums" style={{ color: 'var(--destructive)' }}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {applicants.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <UserRoundCheck className="mx-auto h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {view === 'pending' ? 'لا أحد ينتظر قراركم' : 'لا شيء هنا'}
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {view === 'pending'
              ? 'تظهر هنا طلبات المشاركين والمتطوعين فور تسجيلهم.'
              : 'تظهر هنا الطلبات التي صدر فيها قرار.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => (
            <ApplicantCard key={a.id} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}
