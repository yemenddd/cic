import Link from 'next/link';
import { BarChart3, CalendarCheck, Download, Plus, ScanLine, TrendingUp, UserCheck, Users } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import StatCard from '@/components/admin/StatCard';
import { Panel, EmptyNote } from '@/components/admin/Panel';
import WalkInForm from './WalkInForm';
import BarList, { type BarItem } from '@/components/admin/BarList';
import { relativeArabicDate } from '@/lib/relative-time';
import {
  ATTENDANCE_METHOD_LABELS,
  CHECKPOINT_KIND_LABELS,
  DAY_KEYS,
  DAY_LABELS,
  activeDayKey,
  attendanceRate,
  dayLabel,
} from '@/lib/attendance';
import { ensureDefaultCheckpoints } from '@/lib/attendance-record';
import LiveRefresh from './LiveRefresh';
import CheckpointControls from './CheckpointControls';

export const metadata = { title: 'الحضور | لوحة CIC' };

const TIME = new Intl.DateTimeFormat('ar-u-nu-latn', { timeStyle: 'short' });

export default async function AttendancePage() {
  // Idempotent, and the reason the whole feature works out of the box on the
  // morning of day one with nobody having configured anything.
  await ensureDefaultCheckpoints();

  const today = activeDayKey();

  const [checkpoints, perCheckpoint, attendeeCount, presentCount, totalScans, recent, methodGroups] =
    await Promise.all([
      prisma.checkpoint.findMany({
        orderBy: [{ day: 'asc' }, { order: 'asc' }],
        select: { id: true, nameAr: true, day: true, kind: true, isOpen: true },
      }),
      prisma.attendance.groupBy({ by: ['checkpointId'], _count: { _all: true } }),
      prisma.user.count({ where: { role: 'ATTENDEE' } }),
      // Distinct people, not scans: somebody counted at both doors is one
      // person who attended, and adding the two figures would claim otherwise.
      prisma.user.count({ where: { attendance: { some: {} } } }),
      prisma.attendance.count(),
      prisma.attendance.findMany({
        orderBy: { checkedInAt: 'desc' },
        take: 15,
        select: {
          id: true,
          checkedInAt: true,
          method: true,
          user: { select: { id: true, name: true, email: true, organization: true } },
          checkpoint: { select: { nameAr: true, day: true } },
        },
      }),
      prisma.attendance.groupBy({ by: ['method'], _count: { _all: true } }),
    ]);

  const countByCheckpoint = new Map(perCheckpoint.map((g) => [g.checkpointId, g._count._all]));

  // Per-day totals count each checkpoint's scans; the headline figure below
  // counts people. They answer different questions and are labelled as such.
  const dayTotals = Object.fromEntries(DAY_KEYS.map((d) => [d, 0])) as Record<string, number>;
  for (const c of checkpoints) {
    dayTotals[c.day] = (dayTotals[c.day] ?? 0) + (countByCheckpoint.get(c.id) ?? 0);
  }

  const todayCount = today ? dayTotals[today] ?? 0 : 0;
  const rate = attendanceRate(presentCount, attendeeCount);

  const gateBars: BarItem[] = checkpoints.map((c) => ({
    label: `${c.nameAr} · ${DAY_LABELS[c.day as 'dayOne'] ?? c.day}`,
    count: countByCheckpoint.get(c.id) ?? 0,
    color: c.kind === 'GATE' ? 'var(--accent-cyan)' : 'var(--accent-violet)',
  }));
  const busiest = Math.max(1, ...gateBars.map((b) => b.count));

  const methodBars: BarItem[] = methodGroups.map((g) => ({
    label: ATTENDANCE_METHOD_LABELS[g.method],
    count: g._count._all,
    color: g.method === 'QR' ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
  }));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            الحضور
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {today
              ? `المؤتمر منعقد الآن — ${DAY_LABELS[today]}. كل عملية مسح تظهر هنا فور تسجيلها.`
              : 'سجل الحضور عبر مسح رمز QR على بطاقة المشارك — تُحتسب كل بطاقة مرة واحدة في كل نقطة.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LiveRefresh />
          <Link
            href="/admin/attendance/scan"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <ScanLine className="h-4 w-4" />
            بدء المسح
          </Link>
          <Link
            href="/admin/attendance/report"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
            style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
          >
            <BarChart3 className="h-4 w-4" />
            تحليل الحضور
          </Link>
          <a
            href="/admin/attendance/export"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
            style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={today ? `حضور ${DAY_LABELS[today]}` : 'حضور اليوم'}
          value={todayCount}
          icon={CalendarCheck}
          accent={todayCount > 0 ? 'var(--accent-cyan)' : undefined}
          hint={today ? undefined : 'المؤتمر لم ينعقد اليوم'}
        />
        <StatCard
          label="حضروا فعلياً"
          value={presentCount}
          icon={UserCheck}
          hint={attendeeCount > 0 ? `من ${attendeeCount} مشارك` : undefined}
        />
        <StatCard label="نسبة الحضور" value={rate} icon={TrendingUp} hint="٪ من المسجّلين" />
        <StatCard label="إجمالي عمليات المسح" value={totalScans} icon={Users} />
      </div>

      {/* Placed above the log rather than below it: this is something done
          while somebody waits, and the log is something read afterwards. */}
      <Panel
        title="إضافة حاضر من الباب"
        caption="من حضر دون تسجيل مسبق — يُدرج في قاعدة البيانات ويُحتسب في الحضور"
      >
        <WalkInForm
          checkpoints={checkpoints.map((c) => ({ id: c.id, nameAr: c.nameAr, isOpen: c.isOpen }))}
          defaultCheckpointId={checkpoints.find((c) => c.isOpen && c.day === today)?.id}
        />
      </Panel>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="آخر عمليات التسجيل" caption="الأحدث أولاً، عبر كل النقاط">
            {recent.length === 0 ? (
              <EmptyNote label="لم يُسجَّل أي حضور بعد." />
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--mat-liquid-border)' }}>
                {recent.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/users/${a.user.id}`}
                    className="platform-activity-row -mx-2 flex items-start gap-3 rounded-xl px-2 py-2"
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'color-mix(in srgb, var(--accent-cyan) 14%, transparent)' }}
                    >
                      <UserCheck className="h-4 w-4" style={{ color: 'var(--accent-cyan)' }} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {a.user.name || a.user.email}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                        {a.checkpoint.nameAr} · {dayLabel(a.checkpoint.day)} ·{' '}
                        {TIME.format(a.checkedInAt)} · {ATTENDANCE_METHOD_LABELS[a.method]}
                      </span>
                    </span>

                    <span className="shrink-0 whitespace-nowrap text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {relativeArabicDate(a.checkedInAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="الحضور حسب النقطة" caption="عدد من سُجّلوا في كل نقطة">
            <BarList items={gateBars} basis={busiest} />
          </Panel>

          <Panel title="طريقة التسجيل" caption="المسح مقابل الإدخال اليدوي">
            <BarList items={methodBars} basis={Math.max(1, totalScans)} />
          </Panel>
        </div>
      </div>

      <Panel title="نقاط الحضور" caption="البوابات وقاعات الجلسات التي يُمسح عندها">
        <div className="space-y-2">
          {checkpoints.map((c) => {
            const count = countByCheckpoint.get(c.id) ?? 0;
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'var(--mat-liquid-bg)',
                  border: '1px solid var(--mat-liquid-border)',
                  opacity: c.isOpen ? 1 : 0.62,
                }}
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {c.nameAr}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
                    {dayLabel(c.day)} · {CHECKPOINT_KIND_LABELS[c.kind]} · {count} حضور ·{' '}
                    {c.isOpen ? 'مفتوحة' : 'مغلقة'}
                  </span>
                </span>

                <CheckpointControls checkpointId={c.id} isOpen={c.isOpen} attendance={count} />
              </div>
            );
          })}
        </div>

        <Link
          href="/admin/attendance/checkpoints"
          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة نقطة حضور
        </Link>
      </Panel>
    </div>
  );
}
