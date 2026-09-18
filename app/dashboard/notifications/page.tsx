import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, Megaphone, Lightbulb, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Notification, NotificationKind } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { relativeArabicDate } from '@/lib/relative-time';
import { markAllAsRead, markAsRead, openNotification } from './actions';
import { MarkAllAsReadButton, MarkAsReadButton } from './MarkReadButtons';

// A feed can grow without limit — an announcement fans out to every attendee,
// and a busy conference sends many. Loading the lot would get slower every
// week, so the newest are shown and the rest stay one click away.
const PAGE_SIZE = 25;
const MAX_SHOWN = 200;

const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; tint: string; label: string }> = {
  SUBMISSION: { icon: Lightbulb, tint: 'var(--accent-violet)', label: 'مشروعك' },
  ANNOUNCEMENT: { icon: Megaphone, tint: 'var(--accent-blue)', label: 'إعلان' },
  GENERAL: { icon: Info, tint: 'var(--accent-cyan)', label: 'تنبيه' },
};

/**
 * Day buckets, newest first.
 *
 * A flat list of fifty items all reading "قبل 3 أيام" tells the reader
 * nothing about where one day's news ends and the next begins.
 */
function bucketOf(date: Date, now: Date): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((startOfToday.getTime() - new Date(
    date.getFullYear(), date.getMonth(), date.getDate(),
  ).getTime()) / 86_400_000);

  if (days <= 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return 'هذا الأسبوع';
  if (days < 30) return 'هذا الشهر';
  return 'أقدم';
}

function FilterTabs({ filter, total, unread }: { filter: 'all' | 'unread'; total: number; unread: number }) {
  const tabs = [
    { key: 'all' as const, label: 'الكل', count: total, href: '/dashboard/notifications' },
    { key: 'unread' as const, label: 'غير المقروءة', count: unread, href: '/dashboard/notifications?filter=unread' },
  ];

  return (
    <div
      className="inline-flex rounded-xl p-1"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {tabs.map((tab) => {
        const active = tab.key === filter;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: active ? 'var(--bg-elevated)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: active ? 'var(--shadow-sm)' : undefined,
            }}
          >
            {tab.label}
            <span className="ms-1.5" style={{ color: 'var(--text-tertiary)' }}>
              {tab.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function Row({ n }: { n: Notification }) {
  const { icon: Icon, tint, label } = KIND_STYLE[n.kind] ?? KIND_STYLE.GENERAL;

  return (
    <li
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: n.read ? 'var(--bg-elevated)' : 'var(--surface-highlight)',
        border: '1px solid var(--mat-liquid-border)',
        borderInlineStartWidth: n.read ? '1px' : '3px',
        borderInlineStartColor: n.read ? 'var(--mat-liquid-border)' : tint,
      }}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${tint} 15%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color: tint }} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2
            className="font-outfit text-[14px]"
            style={{ color: 'var(--text-primary)', fontWeight: n.read ? 600 : 700 }}
          >
            {n.title}
          </h2>
          <span className="text-[11px]" style={{ color: tint }}>
            {label}
          </span>
          <span className="ms-auto shrink-0 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {relativeArabicDate(n.createdAt)}
          </span>
        </div>

        {n.body && (
          <p
            className="mt-1 text-[12.5px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {n.body}
          </p>
        )}

        {(n.link || !n.read) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {n.link && (
              // A form, not a link: opening it marks it read on the way
              // through, and still works with no JavaScript.
              <form action={openNotification.bind(null, n.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold"
                  style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-primary)' }}
                >
                  عرض التفاصيل
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
            {!n.read && <MarkAsReadButton action={markAsRead.bind(null, n.id)} />}
          </div>
        )}
      </div>
    </li>
  );
}

export default async function DashboardNotificationsPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ filter?: string; show?: string }>;
}) {
  const session = await auth();
  // The layout guards this too, but a page must never render attendee data on
  // the assumption that something upstream ran.
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const { filter: rawFilter, show } = await searchParams;
  const filter: 'all' | 'unread' = rawFilter === 'unread' ? 'unread' : 'all';
  const requested = Number(show);
  const take = Math.min(
    MAX_SHOWN,
    Number.isFinite(requested) && requested > PAGE_SIZE ? requested : PAGE_SIZE,
  );

  // Deliberately un-wrapped by safe(): a DB outage must surface as an error
  // rather than a misleading "لا توجد إشعارات".
  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, ...(filter === 'unread' ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const matching = filter === 'unread' ? unread : total;
  const hasMore = notifications.length < matching && take < MAX_SHOWN;

  const now = new Date();
  const groups: { label: string; items: Notification[] }[] = [];
  for (const n of notifications) {
    const label = bucketOf(n.createdAt, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <div dir="rtl" className="max-w-3xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            الإشعارات
          </h1>
          <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {unread > 0
              ? `${unread} غير مقروء من ${total}`
              : total > 0
                ? 'كل إشعاراتك مقروءة'
                : 'قرارات اللجنة وإعلانات المؤتمر تصلك هنا'}
          </p>
        </div>
        {unread > 0 && <MarkAllAsReadButton action={markAllAsRead} />}
      </div>

      {total > 0 && (
        <div className="mb-5">
          <FilterTabs filter={filter} total={total} unread={unread} />
        </div>
      )}

      {notifications.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-14 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'var(--mat-liquid-bg)' }}
          >
            {filter === 'unread' ? (
              <Bell className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
            ) : (
              <BellOff className="h-6 w-6" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </div>
          <p className="font-outfit font-bold text-[15px] mb-2" style={{ color: 'var(--text-primary)' }}>
            {filter === 'unread' ? 'لا شيء غير مقروء' : 'لا توجد إشعارات بعد'}
          </p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'unread'
              ? 'اطّلعت على كل شيء. الإشعارات السابقة ما زالت في «الكل».'
              : 'سنُعلمك هنا فور صدور قرار اللجنة على مشاريعك، وعند أي جديد يخص حضورك.'}
          </p>
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <section key={group.label} className="mb-6">
              <h2
                className="mb-3 flex items-center gap-2 font-outfit text-[12.5px] font-bold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {group.label}
                <span className="h-px flex-1" style={{ background: 'var(--mat-liquid-border)' }} aria-hidden />
              </h2>

              <ul className="space-y-2.5">
                {group.items.map((n) => (
                  <Row key={n.id} n={n} />
                ))}
              </ul>
            </section>
          ))}

          {hasMore && (
            <Link
              href={`/dashboard/notifications?${new URLSearchParams({
                ...(filter === 'unread' ? { filter: 'unread' } : {}),
                show: String(Math.min(MAX_SHOWN, take + PAGE_SIZE)),
              })}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold"
              style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-primary)' }}
            >
              عرض المزيد
            </Link>
          )}
        </>
      )}
    </div>
  );
}
