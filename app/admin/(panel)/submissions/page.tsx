import Link from 'next/link';
import { Eye, Search, X } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import Pagination from '@/components/admin/Pagination';
import StatusChip from '@/components/submissions/StatusChip';
import { LIST_PAGE_SIZE, listHref, pageCountFor, parsePage } from '@/lib/admin-list';
import {
  SUBMISSION_STATUSES, SUBMISSION_STATUS_LABELS, SUBMISSION_TRACKS, isSubmissionStatus,
} from '@/lib/submissions';
import { queueHealth, waitingSince, WAIT_COLORS } from '@/lib/submission-queue';
import QueueHealth from './QueueHealth';

interface Props {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ status?: string; q?: string; track?: string; page?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const params = await searchParams;

  const active = params.status && isSubmissionStatus(params.status) ? params.status : null;
  const query = (params.q ?? '').trim().slice(0, 120);
  // Checked against the offered list rather than passed through: an arbitrary
  // string here would be a filter that silently matches nothing while looking
  // like it is working.
  const track = SUBMISSION_TRACKS.includes(params.track ?? '') ? params.track! : null;
  const page = parsePage(params.page);

  const and: Prisma.ProjectSubmissionWhereInput[] = [];
  if (active) and.push({ status: active });
  if (track) and.push({ track });
  if (query) {
    const contains = { contains: query, mode: 'insensitive' as const };
    // Across the project and the person who submitted it: the committee looks
    // things up by whichever of the two they happen to have been told.
    and.push({
      OR: [
        { titleAr: contains },
        { titleEn: contains },
        { summaryAr: contains },
        { track: contains },
        { user: { is: { name: contains } } },
        { user: { is: { email: contains } } },
      ],
    });
  }
  const where: Prisma.ProjectSubmissionWhereInput = and.length > 0 ? { AND: and } : {};

  const [total, submissions, statusGroups, trackGroups, queueRows] = await Promise.all([
    prisma.projectSubmission.count({ where }),
    prisma.projectSubmission.findMany({
      where,
      // Oldest first once a status is being worked through: a review queue is
      // a queue, and the project that has been waiting longest is the one the
      // committee owes an answer to. Browsing everything stays newest-first.
      orderBy: active ? { createdAt: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * LIST_PAGE_SIZE,
      take: LIST_PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.projectSubmission.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.projectSubmission.groupBy({ by: ['track'], _count: { _all: true } }),
    // Just the two columns the health figures are computed from. Counted from
    // one projection rather than several aggregates, so the numbers agree with
    // each other — three counts taken a moment apart do not.
    prisma.projectSubmission.findMany({ select: { status: true, submittedAt: true } }),
  ]);

  const health = queueHealth(queueRows);
  const trackCounts = new Map(trackGroups.map((g) => [g.track ?? '', g._count._all]));

  const counts = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const allCount = statusGroups.reduce((sum, g) => sum + g._count._all, 0);

  const pageCount = pageCountFor(total);
  const current = Math.min(page, pageCount);
  const filtered = Boolean(active || query || track);

  const href = (overrides: Record<string, string | number | undefined>) =>
    listHref('/admin/submissions', {
      status: active ?? '', q: query, track: track ?? '', page: current, ...overrides,
    });

  const chips = [
    { value: '', label: 'الكل', count: allCount },
    ...SUBMISSION_STATUSES.map((s) => ({
      value: s,
      label: SUBMISSION_STATUS_LABELS[s],
      count: counts.get(s) ?? 0,
    })),
  ];

  return (
    <div>
      <ListPageHeader
        title="الابتكارات المقدَّمة"
        description="قائمة مراجعة اللجنة — الأقدم أولاً داخل كل حالة."
      />

      <QueueHealth health={health} />

      <form method="GET" className="relative mb-4">
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ insetInlineStart: 12, color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="ابحث بعنوان المشروع، المسار، أو اسم المقدِّم..."
          className="input-glass"
          style={{ paddingInlineStart: 38 }}
        />
        {/* Carried through, so searching does not silently clear the status
            the committee was working through. */}
        {active && <input type="hidden" name="status" value={active} />}
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chips.map((c) => {
          const isActive = (active ?? '') === c.value;
          return (
            <Link
              key={c.value || 'all'}
              // Changing the filter returns to page one: page 4 of a narrower
              // result set is usually empty, which reads as "no matches".
              href={href({ status: c.value || undefined, page: undefined })}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold"
              style={{
                background: isActive ? 'var(--primary)' : 'var(--mat-liquid-bg)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--text-secondary)',
                border: '1px solid var(--mat-liquid-border)',
              }}
            >
              {c.label}
              {/* The count is the point of the chip row: it says where the
                  queue actually is without opening each filter to find out. */}
              <span style={{ opacity: 0.65 }}>{c.count}</span>
            </Link>
          );
        })}

        {filtered && (
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: 'var(--accent-violet)' }}
          >
            <X className="h-3.5 w-3.5" />
            مسح التصفية
          </Link>
        )}
      </div>

      {/* The committee divides itself by track, so the queue has to divide the
          same way. Only tracks that actually have something in them are
          offered — an empty filter is a dead end dressed as a choice. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SUBMISSION_TRACKS.filter((t) => (trackCounts.get(t) ?? 0) > 0).map((t) => {
          const on = track === t;
          return (
            <Link
              key={t}
              href={href({ track: on ? '' : t, page: 1 })}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold"
              style={{
                background: on ? 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' : 'var(--mat-liquid-bg)',
                color: on ? 'var(--accent-violet)' : 'var(--text-secondary)',
                border: `1px solid ${on ? 'color-mix(in srgb, var(--accent-violet) 30%, transparent)' : 'var(--mat-liquid-border)'}`,
              }}
            >
              {t}
              <span style={{ opacity: 0.65 }}>{trackCounts.get(t)}</span>
            </Link>
          );
        })}
      </div>

      <ListTable>
        <tbody>
          {submissions.length === 0 && (
            <EmptyRow
              colSpan={5}
              label={filtered ? 'لا توجد نتائج مطابقة' : 'لا توجد ابتكارات مقدَّمة بعد'}
            />
          )}
          {submissions.map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                {s.titleAr}
                {s.track && (
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>{s.track}</span>
                )}
              </td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                {s.user.name || '—'}
                <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
                  {s.user.email}
                </span>
              </td>
              <td className="p-3 w-28">
                <StatusChip status={s.status} />
              </td>
              {/* How long it has been waiting, not the date it arrived. A
                  date makes the reader do the subtraction; the queue's whole
                  question is which of these has waited too long. Only for the
                  ones actually waiting — a decided project's age is history. */}
              <td className="p-3 w-32">
                {(() => {
                  const wait = waitingSince(s.submittedAt);
                  if (!wait) {
                    return <span style={{ color: 'var(--text-tertiary)' }}>مسودة</span>;
                  }
                  const pending = s.status === 'PENDING' || s.status === 'UNDER_REVIEW';
                  return (
                    <span
                      className={pending && wait.level !== 'fresh' ? 'font-semibold' : undefined}
                      style={{ color: pending ? WAIT_COLORS[wait.level] : 'var(--text-tertiary)' }}
                      title={new Date(s.submittedAt!).toLocaleDateString('ar')}
                    >
                      {wait.label}
                    </span>
                  );
                })()}
              </td>
              <td className="p-3 w-16">
                <div className="flex items-center justify-end">
                  <Link
                    href={`/admin/submissions/${s.id}`}
                    className="p-1.5 rounded-lg"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="عرض"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>

      <Pagination page={current} pageCount={pageCount} buildHref={(p) => href({ page: p })} />
    </div>
  );
}
