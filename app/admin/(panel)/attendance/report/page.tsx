import Link from 'next/link';
import {
  ArrowRight, Users, UserX, DoorOpen, Repeat, ScanLine, Clock, TriangleAlert, Download,
} from 'lucide-react';
import { prisma } from '@/lib/db/client';
import StatCard from '@/components/admin/StatCard';
import { Panel, EmptyNote } from '@/components/admin/Panel';
import BarList, { type BarItem } from '@/components/admin/BarList';
import { categoryLabel } from '@/lib/categories';
import { DAY_LABELS } from '@/lib/attendance';
import { arabicCount, arabicCountBare, VOLUNTEER, PERSON, SCAN } from '@/lib/arabic-plural';
import { conferenceHasStarted } from '@/lib/conference';
import {
  turnout, turnoutByCategory, arrivalCurve, dayRetention, methodSplit,
  checkpointLoad, rankAttended, byRecorder, rowsForDay, clockLabel,
  type AttendanceRow, type AttendeeFacts, type CheckpointFacts,
} from '@/lib/attendance-analytics';
import ArrivalChart from './ArrivalChart';

export const metadata = { title: 'تحليل الحضور | CIC 2026' };

// Read live: this is opened the evening of day two and again a month later,
// and a cached copy of either is the wrong one.
export const dynamic = 'force-dynamic';

const CATEGORY_COLORS: Record<string, string> = {
  visitor: 'var(--accent-cyan)',
  participant: 'var(--accent-blue)',
  volunteer: 'var(--accent-violet)',
};

/** One finding, stated as a sentence rather than left for the reader to derive. */
function Finding({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warn';
  children: React.ReactNode;
}) {
  return (
    <p
      className="flex items-start gap-2.5 rounded-xl p-3.5 text-[12.5px] leading-relaxed"
      style={{
        background: tone === 'warn'
          ? 'color-mix(in srgb, var(--destructive) 10%, transparent)'
          : 'var(--mat-liquid-bg)',
        border: `1px solid ${tone === 'warn'
          ? 'color-mix(in srgb, var(--destructive) 28%, transparent)'
          : 'var(--mat-liquid-border)'}`,
        color: 'var(--text-secondary)',
      }}
    >
      <TriangleAlert
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: tone === 'warn' ? 'var(--destructive)' : 'var(--text-tertiary)' }}
      />
      <span>{children}</span>
    </p>
  );
}

export default async function AttendanceReportPage() {
  const [rawRows, rawCheckpoints, rawAttendees, recorders] = await Promise.all([
    prisma.attendance.findMany({
      select: { userId: true, checkpointId: true, checkedInAt: true, method: true, recordedById: true },
    }),
    prisma.checkpoint.findMany({
      orderBy: [{ day: 'asc' }, { order: 'asc' }],
      select: { id: true, nameAr: true, day: true },
    }),
    // Only attendees: organizers hold accounts too, and counting them as
    // people who failed to turn up would understate every rate on this page.
    prisma.user.findMany({
      where: { role: 'ATTENDEE' },
      select: { id: true, category: true, country: true, organization: true, walkIn: true },
    }),
    prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, name: true, email: true } }),
  ]);

  const rows: AttendanceRow[] = rawRows;
  const checkpoints: CheckpointFacts[] = rawCheckpoints;
  const attendees: AttendeeFacts[] = rawAttendees;

  const overall = turnout(attendees, rows);
  const byCategory = turnoutByCategory(attendees, rows);
  const retention = dayRetention(rows, checkpoints);
  const methods = methodSplit(rows);
  const loads = checkpointLoad(rows, checkpoints);
  const countries = rankAttended(attendees, rows, 'country');
  const organizations = rankAttended(attendees, rows, 'organization');
  const recorderLoad = byRecorder(rows);

  const dayOneCurve = arrivalCurve(rowsForDay(rows, checkpoints, 'dayOne'));
  const dayTwoCurve = arrivalCurve(rowsForDay(rows, checkpoints, 'dayTwo'));

  const recorderName = new Map(recorders.map((r) => [r.id, r.name || r.email]));

  const categoryBars: BarItem[] = byCategory.map((c) => ({
    label: `${categoryLabel(c.category, 'ar') || 'بلا فئة'} — ${c.attended}/${c.registered} (${c.rate}٪)`,
    count: c.attended,
    color: CATEGORY_COLORS[c.category] ?? 'var(--text-tertiary)',
  }));

  const gateBars: BarItem[] = loads.map((c) => ({
    label: `${c.nameAr}${c.peakLabel ? ` · ذروة ${c.peakLabel}` : ''}`,
    count: c.count,
    color: 'var(--accent-blue)',
  }));

  const countryBars: BarItem[] = countries.map((c) => ({
    label: c.label, count: c.count, color: 'var(--accent-cyan)',
  }));
  const orgBars: BarItem[] = organizations.map((o) => ({
    label: o.label, count: o.count, color: 'var(--accent-violet)',
  }));
  const recorderBars: BarItem[] = recorderLoad.slice(0, 8).map((r) => ({
    label: r.recordedById ? (recorderName.get(r.recordedById) ?? 'حساب محذوف') : 'بلا مُسجِّل',
    count: r.count,
    color: 'var(--primary)',
  }));

  const nothingYet = rows.length === 0;
  // Before the doors have ever opened, every rate on this page is a rate over
  // a conference that has not happened. The figures are still true; saying
  // what they are figures *of* is what keeps them from being read as a verdict.
  const started = conferenceHasStarted();

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            تحليل الحضور
          </h1>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            ليس «كم حضر الآن» — بل ما الذي تعلّمه الباب: من سجّل ولم يأتِ، ومتى جاء الناس
            فعلاً، وكم دامت الذروة، وكم بطاقة لم تعمل، ومن حضر دون تسجيل. أرقام تُبنى عليها
            الدورة القادمة.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/admin/attendance/export"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
            style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </a>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
            style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-primary)' }}
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            الحضور
          </Link>
        </div>
      </div>

      {nothingYet ? (
        <Panel title="لا توجد بيانات حضور بعد">
          <EmptyNote label="سيظهر التحليل هنا بعد أول عملية تسجيل حضور." />
        </Panel>
      ) : (
        <>
          {!started && (
            <Finding>
              المؤتمر لم ينعقد بعد — هذه الأرقام أولية وتخصّ ما سُجّل حتى الآن (تجارب الباب
              أو تسجيلات مبكرة). تُقرأ بعد انتهاء الفعاليات.
            </Finding>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="حضروا فعلاً"
              value={overall.attended}
              icon={Users}
              accent="var(--accent-cyan)"
              hint={`من ${overall.registered} مسجّلاً · ${overall.rate}٪`}
            />
            <StatCard
              label="سجّلوا ولم يأتوا"
              value={overall.noShows}
              icon={UserX}
              accent={overall.noShows > 0 ? 'var(--destructive)' : undefined}
              hint="الرقم الذي تُبنى عليه الضيافة والمقاعد"
            />
            <StatCard
              label="حضروا دون تسجيل"
              value={overall.walkIns}
              icon={DoorOpen}
              hint="أُضيفوا من الباب"
            />
            <StatCard
              label="حضروا اليومين"
              value={retention.both}
              icon={Repeat}
              hint={`${retention.returnRate}٪ من حضور ${DAY_LABELS.dayOne} عادوا`}
            />
          </div>

          {/* The findings, said out loud. A dashboard that leaves every
              conclusion to the reader gets read once. */}
          <div className="space-y-2.5">
            {started && overall.noShows > 0 && overall.registered > 0 && (
              <Finding tone={overall.rate < 60 ? 'warn' : 'neutral'}>
                من كل {arabicCountBare(overall.registered, PERSON)} مسجّلاً حضر{' '}
                {arabicCountBare(overall.attended, PERSON)} ({overall.rate}٪).
                {overall.rate < 60
                  ? ' أقل من ثلثي المسجّلين — تذكير قبل الموعد أو تأكيد حضور مسبق يرفع هذا الرقم أكثر من أي توسعة في القاعة.'
                  : ' خطّط للضيافة والمقاعد على هذه النسبة لا على عدد المسجّلين.'}
              </Finding>
            )}

            {/* Needs enough scans to mean anything: one manual entry out of
                three is 33%, and says nothing at all about the badges. */}
            {methods.manual > 0 && methods.qr + methods.manual >= 20 && (
              <Finding tone={methods.manualRate > 25 ? 'warn' : 'neutral'}>
                {methods.manualRate}٪ من التسجيلات كانت يدوية ({methods.manual} من {methods.qr + methods.manual}).
                {methods.manualRate > 25
                  ? ' نسبة عالية — غالباً بطاقات لم تُطبع أو هواتف بلا شحن. طباعة البطاقات مسبقاً للمسجّلين تقلّل الزحام عند الباب.'
                  : ' المسح يعمل، والبطاقة تصمد عند الباب.'}
              </Finding>
            )}

            {dayOneCurve.peak && dayOneCurve.total >= 10 && (
              <Finding>
                ذروة اليوم الأول كانت الساعة {dayOneCurve.peak.label} بـ
                {arabicCountBare(dayOneCurve.peak.count, PERSON)} في نصف ساعة — وهو العدد الذي
                يجب أن يستوعبه الباب.
                {dayOneCurve.firstMinutes !== null && dayOneCurve.medianMinutes !== null && (
                  <> أول حضور {clockLabel(dayOneCurve.firstMinutes)}، ونصف الحضور اكتمل بحلول {clockLabel(dayOneCurve.medianMinutes)}.</>
                )}
              </Finding>
            )}

            {overall.walkIns > 0 && (
              <Finding>
                {arabicCount(overall.walkIns, PERSON)} {overall.walkIns === 1 ? 'حضر' : 'حضروا'} دون
                تسجيل مسبق — أي أن التسجيل المسبق لم يلتقط
                {' '}{Math.round((overall.walkIns / (overall.attended + overall.walkIns)) * 100)}٪
                من الحاضرين فعلاً.
              </Finding>
            )}

            {retention.dayTwo > 0 && retention.returnRate < 50 && (
              <Finding tone="warn">
                أقل من نصف حضور اليوم الأول عادوا في الثاني ({retention.returnRate}٪).
                يستحق النظر في برنامج اليوم الثاني ووقته.
              </Finding>
            )}
          </div>

          <Panel
            title="الحضور حسب الفئة"
            caption="من حضر فعلاً من كل فئة، ونسبته من مسجّلي تلك الفئة"
          >
            <BarList items={categoryBars} basis={Math.max(...byCategory.map((c) => c.registered), 1)} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={`منحنى الوصول · ${DAY_LABELS.dayOne}`} caption="كل عمود نصف ساعة بتوقيت المكان">
              <ArrivalChart
                curve={dayOneCurve}
                caption={dayOneCurve.peak
                  ? `${arabicCountBare(dayOneCurve.total, SCAN)} · الذروة ${dayOneCurve.peak.label}`
                  : undefined}
              />
            </Panel>
            <Panel title={`منحنى الوصول · ${DAY_LABELS.dayTwo}`} caption="كل عمود نصف ساعة بتوقيت المكان">
              <ArrivalChart
                curve={dayTwoCurve}
                caption={dayTwoCurve.peak
                  ? `${arabicCountBare(dayTwoCurve.total, SCAN)} · الذروة ${dayTwoCurve.peak.label}`
                  : undefined}
              />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="العودة في اليوم الثاني" caption="من حضر يوماً واحداً ومن حضر اليومين">
              <BarList
                items={[
                  { label: 'حضروا اليومين', count: retention.both, color: 'var(--accent-cyan)' },
                  { label: `${DAY_LABELS.dayOne} فقط`, count: retention.dayOneOnly, color: 'var(--accent-blue)' },
                  { label: `${DAY_LABELS.dayTwo} فقط`, count: retention.dayTwoOnly, color: 'var(--accent-violet)' },
                ]}
                basis={Math.max(retention.dayOne, retention.dayTwo, 1)}
              />
            </Panel>

            <Panel title="طريقة التسجيل" caption="المسح مقابل الإدخال اليدوي">
              <BarList
                items={[
                  { label: 'مسح رمز QR', count: methods.qr, color: 'var(--accent-cyan)' },
                  { label: 'إدخال يدوي', count: methods.manual, color: 'var(--text-tertiary)' },
                ]}
                basis={Math.max(methods.qr + methods.manual, 1)}
              />
            </Panel>
          </div>

          <Panel title="الحمل على كل نقطة" caption="عدد من سُجّلوا، وذروة نصف الساعة في كل نقطة">
            <BarList items={gateBars} basis={Math.max(...loads.map((l) => l.count), 1)} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="الدول الأكثر حضوراً" caption="بين من حضروا فعلاً، لا بين من سجّلوا">
              <BarList items={countryBars} basis={countryBars[0]?.count ?? 1} />
            </Panel>
            <Panel title="الجهات الأكثر حضوراً" caption="بين من حضروا فعلاً">
              <BarList items={orgBars} basis={orgBars[0]?.count ?? 1} />
            </Panel>
          </div>

          <Panel
            title="توزيع المسح على الفريق"
            caption="ليس ترتيباً للأداء — بل قراءة لعمق الفريق عند الباب"
          >
            <BarList items={recorderBars} basis={recorderBars[0]?.count ?? 1} />
            {recorderLoad.length > 1 && recorderLoad[0].count > rows.length * 0.7 && (
              <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                شخص واحد نفّذ أكثر من ٧٠٪ من عمليات المسح — الباب كان بعمق شخص واحد مهما قال
                الجدول. {arabicCountBare(2, VOLUNTEER)} على الأقل في وقت الذروة.
              </p>
            )}
          </Panel>

          <div className="flex items-start gap-2.5 text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              كل الأوقات بتوقيت المكان (إسطنبول، UTC+3). «حضر» تعني شخصاً واحداً مهما تعدّدت
              نقاط مسحه، و«عمليات المسح» تعدّ كل مسح على حدة.
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            <ScanLine className="h-3.5 w-3.5 shrink-0" />
            {arabicCountBare(rows.length, SCAN)} عبر {checkpoints.length} نقطة.
          </div>
        </>
      )}
    </div>
  );
}
