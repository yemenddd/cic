import Link from 'next/link';
import { Pencil, MapPin, HandHeart } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import { CONFERENCE_DAYS } from '@/lib/conference';
import { byStartTime, rosterHealth, type ShiftLike } from '@/lib/volunteering';
import { arabicCountBare, VOLUNTEER } from '@/lib/arabic-plural';
import { committeeLabel } from '@/lib/committees';
import RosterSummary from './RosterSummary';
import { OpenToggle, RemoveVolunteer } from './ShiftControls';
import { deleteShift } from './actions';

// Volunteers claim and release places while this page is open, and a cached
// roster is a roster somebody staffs the door from.
export const dynamic = 'force-dynamic';

const DATE_LABEL = new Intl.DateTimeFormat('ar-u-nu-latn', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const DAYS = [
  { key: 'dayOne' as const, date: CONFERENCE_DAYS.dayOne },
  { key: 'dayTwo' as const, date: CONFERENCE_DAYS.dayTwo },
];

export default async function AdminVolunteeringPage() {
  const [shifts, volunteerCount, assignedUsers] = await Promise.all([
    prisma.volunteerShift.findMany({
      orderBy: [{ day: 'asc' }, { order: 'asc' }],
      include: {
        assignments: {
          orderBy: { createdAt: 'asc' },
          select: {
            userId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.user.count({ where: { category: 'volunteer' } }),
    // Distinct volunteers with at least one shift, so "بلا فترة" counts people
    // and not places.
    prisma.volunteerAssignment.findMany({ distinct: ['userId'], select: { userId: true } }),
  ]);

  const asShift = (s: (typeof shifts)[number]): ShiftLike => ({
    id: s.id,
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    isOpen: s.isOpen,
    taken: s.assignments.length,
    committee: s.committee,
  });

  const health = rosterHealth(shifts.map(asShift));

  const knownDays = new Set(DAYS.map((d) => d.key as string));
  const groups = [
    ...DAYS.map(({ key, date }) => ({
      key: key as string,
      label: DATE_LABEL.format(new Date(date.y, date.m - 1, date.d)),
      shifts: byStartTime(shifts.filter((s) => s.day === key)),
    })),
    {
      key: 'other',
      label: 'فترات بيوم غير معروف',
      shifts: byStartTime(shifts.filter((s) => !knownDays.has(s.day))),
    },
  ].filter((g) => g.shifts.length > 0);

  return (
    <div>
      <ListPageHeader
        title="التطوّع"
        description="فترات العمل التي يسجّل فيها المتطوعون. إغلاق الفترة يوقف التسجيل الجديد ولا يمسّ من سجّل فيها."
        addHref="/admin/volunteering/new"
        addLabel="فترة جديدة"
      />

      <RosterSummary
        health={health}
        volunteerCount={volunteerCount}
        unassignedVolunteers={Math.max(0, volunteerCount - assignedUsers.length)}
      />

      {shifts.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <HandHeart className="mx-auto h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            لا توجد فترات تطوّع بعد
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            أضف فترة ليظهر جدول التطوّع في حسابات المتطوعين.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="mb-8">
            <h2
              className="mb-3 flex items-center gap-2 font-outfit text-[15px] font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {group.label}
              <span className="h-px flex-1" style={{ background: 'var(--mat-liquid-border)' }} aria-hidden />
            </h2>

            <div className="space-y-3">
              {group.shifts.map((s) => {
                const taken = s.assignments.length;
                const short = Math.max(0, s.capacity - taken);

                return (
                  <div
                    key={s.id}
                    className="rounded-2xl p-4"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--mat-liquid-border)',
                      // The shifts nobody has taken are the ones this page
                      // exists to surface, so they carry the edge.
                      borderInlineStartWidth: taken === 0 && s.isOpen ? '3px' : '1px',
                      borderInlineStartColor:
                        taken === 0 && s.isOpen ? 'var(--destructive)' : 'var(--mat-liquid-border)',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {s.titleAr}
                          </h3>
                          <OpenToggle id={s.id} isOpen={s.isOpen} />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span dir="ltr" className="tabular-nums">{s.startTime} — {s.endTime}</span>
                          <span
                            className="rounded-lg px-2 py-0.5"
                            style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
                          >
                            {committeeLabel(s.committee)}
                          </span>
                          {s.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                              {s.location}
                            </span>
                          )}
                        </div>

                        {s.notesAr && (
                          <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {s.notesAr}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* dir=ltr, or the bidi algorithm reorders the pair in
                            an RTL page and "0 / 3" is read out as three of
                            zero — the wrong way round on the one figure an
                            organizer scans this page for. */}
                        <span
                          dir="ltr"
                          className="me-1 text-[12px] font-semibold tabular-nums"
                          style={{ color: short > 0 ? 'var(--destructive)' : 'var(--accent-cyan)' }}
                        >
                          {taken} / {s.capacity}
                        </span>
                        <Link
                          href={`/admin/volunteering/${s.id}`}
                          className="rounded-lg p-1.5"
                          style={{ color: 'var(--text-tertiary)' }}
                          aria-label="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteButton
                          action={deleteShift.bind(null, s.id)}
                          confirmText={
                            taken > 0
                              ? `حذف «${s.titleAr}»؟ سيُلغى تسجيل ${arabicCountBare(taken, VOLUNTEER)} فيها.`
                              : `حذف «${s.titleAr}» نهائياً؟`
                          }
                        />
                      </div>
                    </div>

                    {/* The roster itself. An organizer standing at the door
                        needs the names, not a count of them. */}
                    <div
                      className="mt-3 flex flex-wrap items-center gap-1.5 pt-3"
                      style={{ borderTop: '1px solid var(--mat-liquid-border)' }}
                    >
                      {taken === 0 ? (
                        <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                          لم يسجّل أحد بعد
                        </span>
                      ) : (
                        s.assignments.map((a) => (
                          <span
                            key={a.userId}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px]"
                            style={{
                              background: 'var(--mat-liquid-bg)',
                              border: '1px solid var(--mat-liquid-border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Link
                              href={`/admin/users/${a.user.id}`}
                              className="truncate max-w-[12rem]"
                              title={a.user.email}
                            >
                              {a.user.name || a.user.email}
                            </Link>
                            <RemoveVolunteer
                              shiftId={s.id}
                              userId={a.userId}
                              name={a.user.name || a.user.email}
                            />
                          </span>
                        ))
                      )}

                      {short > 0 && s.isOpen && (
                        <span className="ms-auto text-[11.5px]" style={{ color: 'var(--destructive)' }}>
                          ينقص {arabicCountBare(short, VOLUNTEER)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
