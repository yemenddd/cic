import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import type { ProgramSession } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import SaveSessionButton from '@/components/dashboard/SaveSessionButton';

export const metadata: Metadata = {
  title: 'جدولي | مؤتمر الإبداع والابتكار 2026',
  robots: { index: false, follow: false },
};

const DAYS = [
  { key: 'dayOne', label: 'يوم أول' },
  { key: 'dayTwo', label: 'يوم ثاني' },
] as const;

function SessionCard({ session, saved }: { session: ProgramSession; saved: boolean }) {
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
        <p className="text-[12px] font-medium" dir="ltr" style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}>
          {session.time}
        </p>
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
      </div>

      <SaveSessionButton sessionId={session.id} saved={saved} />
    </div>
  );
}

function DayGroup({
  label,
  sessions,
  savedIds,
}: {
  label: string;
  sessions: ProgramSession[];
  savedIds: Set<string>;
}) {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="mb-3 font-outfit text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </h3>
      <div className="space-y-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} saved={savedIds.has(s.id)} />
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

  return (
    <div className="max-w-3xl">
      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            جدولي
          </h1>
          <span className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {mine.length} جلسة
          </span>
        </div>

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
            />
          ))
        )}
      </section>
    </div>
  );
}
