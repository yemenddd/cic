import Link from 'next/link';
import { UserPlus, Lightbulb, Megaphone, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyNote } from '@/components/admin/Panel';
import { relativeArabicDate } from '@/lib/relative-time';

/**
 * One stream of what has actually happened, newest first.
 *
 * The overview previously showed only the last five submissions, which on a
 * conference that has not opened its call for projects yet is an empty box the
 * size of a table. Signups, submissions and announcements are the three things
 * that move on this platform, so they are merged into one feed — the question
 * an organiser opens the panel with is "what happened since I last looked",
 * not "what happened in each table separately".
 *
 * Registrations are deliberately absent: signing up creates a User *and* a
 * Registration row, so including both would report every newcomer twice.
 */

export type ActivityKind = 'account' | 'submission' | 'announcement';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  meta?: string;
  at: Date;
  href?: string;
}

const STYLES: Record<ActivityKind, { icon: LucideIcon; tint: string; verb: string }> = {
  account: { icon: UserPlus, tint: 'var(--accent-cyan)', verb: 'انضم' },
  submission: { icon: Lightbulb, tint: 'var(--accent-violet)', verb: 'ابتكار جديد' },
  announcement: { icon: Megaphone, tint: 'var(--accent-blue)', verb: 'إعلان' },
};

function Row({ item }: { item: ActivityItem }) {
  const { icon: Icon, tint, verb } = STYLES[item.kind];

  const body = (
    <>
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color: tint }} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </span>
          <span className="text-[11px]" style={{ color: tint }}>
            {verb}
          </span>
        </span>

        {item.meta && (
          <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {item.meta}
          </span>
        )}
      </span>

      <span className="shrink-0 text-[11px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
        {relativeArabicDate(item.at)}
      </span>
    </>
  );

  const className = 'flex items-start gap-3 py-2';

  return item.href ? (
    <Link href={item.href} className={`${className} platform-activity-row -mx-2 rounded-xl px-2`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyNote label="لا يوجد نشاط بعد — سيظهر هنا كل تسجيل وابتكار وإعلان." />;
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--mat-liquid-border)' }}>
      {items.map((item) => (
        <Row key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

export function FeedFooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold"
      style={{ color: 'var(--text-secondary)' }}
    >
      {label}
      <ArrowLeft className="h-3.5 w-3.5" />
    </Link>
  );
}
