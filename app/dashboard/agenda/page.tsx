import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, CalendarPlus, Download, Clock } from 'lucide-react';
import type { ProgramSession } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { resolveSessionInterval } from '@/lib/ics';
import { clashesWithAny, countClashPairs, findClashingIds, type AgendaItem } from '@/lib/agenda';
import { CONFERENCE_DAYS } from '@/lib/conference';
import { arabicCountBare, SESSION, CLASH } from '@/lib/arabic-plural';
import SaveSessionButton from '@/components/dashboard/SaveSessionButton';

export const metadata: Metadata = {
  title: 'جدولي | مؤتمر الإبداع والابتكار',
  robots: { index: false, follow: false },
};

const DATE_LABEL = new Intl.DateTimeFormat('ar-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const DAYS = [
  { key: 'dayOne' as const, date: CONFERENCE_DAYS.dayOne },
  { key: 'dayTwo' as const, date: CONFERENCE_DAYS.dayTwo },
];

// 'clash' — this saved session overlaps another saved session.
// 'risk'  — saving this session would overlap something already saved.
type ClashBadge = 'clash' | 'risk' | null;

function ClashChip({ kind }: { kind: Exclude<ClashBadge, null> }) {
  if (kind === 'risk') {
    // Deliberately flat text, not a chip: this is a heads-up on a session the
    // attendee has not chosen yet, and it must not shout louder than the real
    // conflicts among the ones they have.
    return (
      <span
        className="inline-flex items-center gap-1 text-[11.5px]"
        style={{ color: 'var(--destructive)' }}
        title="هذه الجلسة تتقاطع مع جلسة محفوظة في جدولك"
      >
        <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
        قد تتعارض مع جلسة في جدولك
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-semibold"
      style={{
        background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
        color: 'var(--destructive)',
      }}
      title="تتقاطع هذه الجلسة زمنيًا مع جلسة أخرى في جدولك"
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      تعارض
    </span>
  );
}

/**
 * One row of the timeline: the clock time in a fixed rail, then the session.
 *
 * The rail is what makes this read as a schedule rather than as a list of
 * cards — times line up down the page, so gaps and back-to-back sessions are
 * visible at a glance instead of having to be read out of each card.
 */
function TimelineRow({
  session,
  saved,
  badge,
  isLast,
}: {
  session: ProgramSession;
  saved: boolean;
  badge: ClashBadge;
  isLast: boolean;
}) {
  return (
    <li className="flex gap-3 sm:gap-4">
      <div className="relative flex w-14 shrink-0 flex-col items-center pt-4">
        <span
          className="text-[12px] font-semibold tabular-nums"
          dir="ltr"
          style={{ color: saved ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
        >
          {session.time}
        </span>
        <span
          aria-hidden
          className="mt-2 h-2 w-2 shrink-0 rounded-full"
          style={{
            background: saved ? (session.color || 'var(--accent-violet)') : 'var(--border-strong)',
          }}
        />
        {/* The connector stops at the last row so the line doesn't dangle. */}
        {!isLast && (
          <span
            aria-hidden
            className="mt-1 w-px flex-1"
            style={{ background: 'var(--border-default)' }}
          />
        )}
      </div>

      <div
        className="mb-3 min-w-0 flex-1 rounded-2xl p-4"
        style={{
          // A saved session is the attendee's own choice, so it carries the
          // accent; an unsaved one stays quiet so the agenda reads first.
          background: saved ? 'var(--surface-highlight)' : 'var(--bg-elevated)',
          border: '1px solid var(--mat-liquid-border)',
          borderInlineStartWidth: saved ? '3px' : '1px',
          borderInlineStartColor: saved
            ? session.color || 'var(--accent-violet)'
            : 'var(--mat-liquid-border)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-[14.5px] font-semibold leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                {session.titleAr}
              </h3>
              {badge === 'clash' && <ClashChip kind="clash" />}
            </div>

            {session.speakerNameAr && (
              <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                {session.speakerNameAr}
                {session.speakerRoleAr && (
                  <span style={{ color: 'var(--text-tertiary)' }}> — {session.speakerRoleAr}</span>
                )}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {session.trackAr && (
                <span
                  className="inline-block rounded-lg px-2 py-0.5 text-[11.5px]"
                  style={{
                    background: 'var(--mat-liquid-bg)',
                    border: '1px solid var(--mat-liquid-border)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {session.trackAr}
                </span>
              )}
              {badge === 'risk' && <ClashChip kind="risk" />}
            </div>
          </div>

          <SaveSessionButton sessionId={session.id} saved={saved} />
        </div>
      </div>
    </li>
  );
}

/** The two views, expressed as a URL rather than client state. */
function ViewTabs({ view, total, mine }: { view: 'all' | 'mine'; total: number; mine: number }) {
  const tabs = [
    { key: 'all' as const, label: 'كل الجلسات', count: total, href: '/dashboard/agenda' },
    { key: 'mine' as const, label: 'جدولي', count: mine, href: '/dashboard/agenda?view=mine' },
  ];

  return (
    <div
      className="inline-flex rounded-xl p-1"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {tabs.map((tab) => {
        const active = tab.key === view;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors"
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

export default async function AgendaPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  // proxy.ts already gates /dashboard/*; this is the type-narrowing backstop.
  if (!userId) redirect('/login');

  const { view: rawView } = await searchParams;
  const view: 'all' | 'mine' = rawView === 'mine' ? 'mine' : 'all';

  // Queried directly rather than through safe() from lib/db/queries.ts: that
  // helper swallows errors into [], which would show an attendee an empty
  // agenda during a DB outage as if they had saved nothing.
  const [sessions, saved] = await Promise.all([
    prisma.programSession.findMany({ orderBy: [{ day: 'asc' }, { order: 'asc' }] }),
    prisma.savedSession.findMany({ where: { userId }, select: { sessionId: true } }),
  ]);

  const savedIds = new Set(saved.map((s) => s.sessionId));
  const mine = sessions.filter((s) => savedIds.has(s.id));

  // Every clock calculation on this page goes through resolveSessionInterval so
  // the warning below and the .ics export can never disagree about when a
  // session starts. A null interval means the free-text `time` didn't parse (or
  // the day is unknown); such a session is shown as-is and never flagged —
  // a false conflict trains attendees to ignore real ones.
  const itemById = new Map<string, AgendaItem>(
    sessions.map((s) => {
      const interval = resolveSessionInterval(s);
      return [s.id, { id: s.id, start: interval?.start ?? null, end: interval?.end ?? null }];
    }),
  );
  const itemFor = (s: ProgramSession): AgendaItem =>
    itemById.get(s.id) ?? { id: s.id, start: null, end: null };

  const mineItems = mine.map(itemFor);
  const clashingIds = findClashingIds(mineItems);
  const clashPairs = countClashPairs(mineItems);
  const unknownTimeCount = mineItems.filter((i) => !i.start).length;

  const badgeFor = (s: ProgramSession): ClashBadge => {
    // Already in the agenda: show the real conflict, not a hypothetical one.
    if (savedIds.has(s.id)) return clashingIds.has(s.id) ? 'clash' : null;
    return clashesWithAny(itemFor(s), mineItems) ? 'risk' : null;
  };

  // One list, filtered — rather than the previous two sections, which repeated
  // every saved session in full a second time further down the page.
  const shown = view === 'mine' ? mine : sessions;

  const days = DAYS.map(({ key, date }) => ({
    key,
    label: DATE_LABEL.format(new Date(date.y, date.m - 1, date.d)),
    sessions: shown.filter((s) => s.day === key),
    savedCount: mine.filter((s) => s.day === key).length,
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            جدولي
          </h1>
          <p className="mt-1.5 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {mine.length > 0
              ? `${arabicCountBare(mine.length, SESSION)} في جدولك — ${days
                  .map((d) => `${d.label.split('،')[0]}: ${d.savedCount}`)
                  .join(' · ')}`
              : 'اختر الجلسات التي تهمّك لتبني جدولك الخاص.'}
          </p>
        </div>

        {mine.length > 0 && (
          // Plain <a download>, not <Link>: this is a Route Handler serving a
          // file, so it must leave the client router and hit the network.
          <a
            href="/dashboard/agenda/export"
            download="cic-2026-agenda.ics"
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Download className="h-3.5 w-3.5" />
            تصدير إلى التقويم
          </a>
        )}
      </div>

      {clashPairs > 0 && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
            color: 'var(--destructive)',
          }}
        >
          <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {arabicCountBare(clashPairs, CLASH)} في المواعيد: جلسات محفوظة تتقاطع زمنيًا،
            ومعلَّمة بـ«تعارض» أدناه.
          </span>
        </div>
      )}

      {unknownTimeCount > 0 && (
        // Said out loud rather than hidden: these sessions are excluded from
        // the check above, so a clean agenda doesn't silently mean «no
        // conflicts».
        <p
          className="mb-4 flex items-center gap-1.5 text-[12px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {arabicCountBare(unknownTimeCount, SESSION)} بلا وقت محدَّد، فلم تُفحص للتعارض.
        </p>
      )}

      {sessions.length > 0 && (
        <div className="mb-6">
          <ViewTabs view={view} total={sessions.length} mine={mine.length} />
        </div>
      )}

      {sessions.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center text-[13px]"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-tertiary)',
          }}
        >
          لم يُنشر برنامج المؤتمر بعد
        </div>
      ) : shown.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <CalendarPlus className="mx-auto h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            جدولك فارغ حتى الآن
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            افتح «كل الجلسات» واحفظ ما يهمّك ليظهر هنا.
          </p>
          <Link
            href="/dashboard/agenda"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            كل الجلسات
          </Link>
        </div>
      ) : (
        days
          .filter((d) => d.sessions.length > 0)
          .map((day) => (
            <section key={day.key} className="mb-7">
              <h2
                className="mb-3 flex items-center gap-2 font-outfit text-[13.5px] font-bold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {day.label}
                <span
                  className="h-px flex-1"
                  style={{ background: 'var(--mat-liquid-border)' }}
                  aria-hidden
                />
              </h2>

              <ul>
                {day.sessions.map((s, i) => (
                  <TimelineRow
                    key={s.id}
                    session={s}
                    saved={savedIds.has(s.id)}
                    badge={badgeFor(s)}
                    isLast={i === day.sessions.length - 1}
                  />
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  );
}
