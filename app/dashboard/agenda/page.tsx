import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AlertTriangle, CalendarPlus, Download } from 'lucide-react';
import type { ProgramSession } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { resolveSessionInterval } from '@/lib/ics';
import { clashesWithAny, countClashPairs, findClashingIds, type AgendaItem } from '@/lib/agenda';
import SaveSessionButton from '@/components/dashboard/SaveSessionButton';

export const metadata: Metadata = {
  title: 'جدولي | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

const DAYS = [
  { key: 'dayOne', label: 'يوم أول', statLabel: 'اليوم الأول' },
  { key: 'dayTwo', label: 'يوم ثاني', statLabel: 'اليوم الثاني' },
] as const;

// 'clash' — this saved session overlaps another saved session.
// 'risk'  — saving this session would overlap something already saved.
type ClashBadge = 'clash' | 'risk' | null;

/** Arabic counts are not English counts: 2 has its own form, 3–10 take the plural. */
function countLabel(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

function ClashChip({ kind }: { kind: Exclude<ClashBadge, null> }) {
  if (kind === 'risk') {
    // Deliberately flat text, not a chip: this is a heads-up on a session the
    // attendee has not chosen yet, and it must not shout louder than the real
    // conflicts in «جدولي» above it.
    return (
      <span
        className="mt-1 inline-flex items-center gap-1 text-[11.5px]"
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

function SessionCard({
  session,
  saved,
  badge,
}: {
  session: ProgramSession;
  saved: boolean;
  badge: ClashBadge;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--mat-liquid-border)',
        // The admin-set color is an accent stripe, not a background — it has to
        // stay legible against both the light and the dark surface.
        borderInlineStartWidth: session.color ? '3px' : '1px',
        borderInlineStartColor: session.color || 'var(--mat-liquid-border)',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-[12px] font-medium"
            dir="ltr"
            style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}
          >
            {session.time}
          </p>
          {badge === 'clash' && <ClashChip kind="clash" />}
        </div>
        <h3 className="mt-1 text-[14.5px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {session.titleAr}
        </h3>
        {session.speakerNameAr && (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {session.speakerNameAr}
            {session.speakerRoleAr && (
              <span style={{ color: 'var(--text-tertiary)' }}> — {session.speakerRoleAr}</span>
            )}
          </p>
        )}
        {session.trackAr && (
          <span
            className="mt-2 inline-block rounded-lg px-2 py-0.5 text-[11.5px]"
            style={{
              background: 'var(--mat-liquid-bg)',
              border: '1px solid var(--mat-liquid-border)',
              color: 'var(--text-tertiary)',
            }}
          >
            {session.trackAr}
          </span>
        )}
        {badge === 'risk' && (
          <div>
            <ClashChip kind="risk" />
          </div>
        )}
      </div>

      <SaveSessionButton sessionId={session.id} saved={saved} />
    </div>
  );
}

function DayGroup({
  label,
  sessions,
  savedIds,
  badgeFor,
}: {
  label: string;
  sessions: ProgramSession[];
  savedIds: Set<string>;
  badgeFor: (session: ProgramSession) => ClashBadge;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="mb-3 font-outfit text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </h3>
      <div className="space-y-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} saved={savedIds.has(s.id)} badge={badgeFor(s)} />
        ))}
      </div>
    </div>
  );
}

export default async function AgendaPage() {
  const session = await auth();
  const userId = session?.user?.id;
  // proxy.ts already gates /dashboard/*; this is the type-narrowing backstop.
  if (!userId) redirect('/login');

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

  const perDay = DAYS.map((d) => ({
    ...d,
    count: mine.filter((s) => s.day === d.key).length,
  }));

  const savedBadge = (s: ProgramSession): ClashBadge => (clashingIds.has(s.id) ? 'clash' : null);
  const programBadge = (s: ProgramSession): ClashBadge => {
    // Already in the agenda: show the real conflict, not a hypothetical one.
    if (savedIds.has(s.id)) return savedBadge(s);
    return clashesWithAny(itemFor(s), mineItems) ? 'risk' : null;
  };

  return (
    <div className="max-w-3xl">
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            جدولي
          </h1>
          <div className="flex items-center gap-3">
            {mine.length > 0 && (
              // Plain <a download>, not <Link>: this is a Route Handler serving a
              // file, so it must leave the client router and hit the network.
              <a
                href="/dashboard/agenda/export"
                download="cict-2026-agenda.ics"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Download className="h-3.5 w-3.5" />
                تصدير إلى التقويم
              </a>
            )}
          </div>
        </div>

        {mine.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {countLabel(mine.length, 'جلسة واحدة', 'جلستان', 'جلسات', 'جلسة')} في جدولك
              </span>
              {perDay.map(({ key, statLabel, count }) => (
                <span key={key}>
                  <span aria-hidden="true"> · </span>
                  {statLabel}: {count}
                </span>
              ))}
            </p>

            {clashPairs > 0 && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl px-3 py-2 text-[12.5px] leading-relaxed"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
                  color: 'var(--destructive)',
                }}
              >
                <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {countLabel(clashPairs, 'تعارض واحد', 'تعارضان', 'تعارضات', 'تعارضًا')} في المواعيد:
                  جلسات محفوظة تتقاطع زمنيًا. الجلسات المعنيّة معلَّمة بـ«تعارض» في الأسفل.
                </span>
              </div>
            )}

            {unknownTimeCount > 0 && (
              // Said out loud rather than hidden: these sessions are excluded
              // from the check above, so a clean agenda here doesn't silently
              // mean «no conflicts».
              <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
                {countLabel(unknownTimeCount, 'جلسة واحدة', 'جلستان', 'جلسات', 'جلسة')} بلا وقت محدَّد،
                فلم تُفحص للتعارض.
              </p>
            )}
          </div>
        )}

        {mine.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <CalendarPlus className="mx-auto h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
            <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              جدولك فارغ حتى الآن
            </p>
            <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              اختر الجلسات التي تهمّك من «كل الجلسات» في الأسفل لتظهر هنا.
            </p>
          </div>
        ) : (
          DAYS.map(({ key, label }) => (
            <DayGroup
              key={key}
              label={label}
              sessions={mine.filter((s) => s.day === key)}
              savedIds={savedIds}
              badgeFor={savedBadge}
            />
          ))
        )}
      </section>

      <section>
        <h2 className="mb-4 font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          كل الجلسات
        </h2>

        {sessions.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center text-[13px]"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--mat-liquid-border)',
              color: 'var(--text-tertiary)',
            }}
          >
            لم يُنشر برنامج المؤتمر بعد
          </div>
        ) : (
          DAYS.map(({ key, label }) => (
            <DayGroup
              key={key}
              label={label}
              sessions={sessions.filter((s) => s.day === key)}
              savedIds={savedIds}
              badgeFor={programBadge}
            />
          ))
        )}
      </section>
    </div>
  );
}
