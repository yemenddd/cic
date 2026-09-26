import { redirect } from 'next/navigation';
import {
  CalendarClock, MapPin, ScanLine, Smartphone, Printer, TriangleAlert, CircleCheck,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { badgeToken } from '@/lib/badge-token';
import { dict } from '@/lib/dictionary';
import { CONFERENCE_DAYS, daysUntilConference, conferenceHasStarted } from '@/lib/conference';
import { arabicCountBare, DAY } from '@/lib/arabic-plural';
import { dayLabel, ATTENDANCE_METHOD_LABELS } from '@/lib/attendance';
import DashboardBadge from '@/components/dashboard/DashboardBadge';
import GatePass from './GatePass';

export const metadata = {
  title: 'بطاقتي | CIC',
};

const DAY_ONLY = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });

function dateOf({ y, m, d }: { y: number; m: number; d: number }): Date {
  return new Date(y, m - 1, d);
}

/** One line of practical guidance beside the pass. */
function Tip({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ScanLine;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--mat-liquid-bg)' }}
      >
        <Icon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
        <span className="mt-1 block text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {body}
        </span>
      </span>
    </li>
  );
}

export default async function BadgePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // The attendee's own record — no safe() wrapper, so a DB failure surfaces
  // instead of quietly rendering an empty badge.
  const [user, attendance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        category: true,
        organization: true,
        track: true,
        confirmationCode: true,
      },
    }),
    // What the badge has actually done. The page explained at length that the
    // QR records attendance and then never said whether it had — which is the
    // one question worth asking of it once the doors are open.
    prisma.attendance.findMany({
      where: { userId: session.user.id },
      orderBy: { checkedInAt: 'asc' },
      select: {
        id: true,
        checkedInAt: true,
        method: true,
        checkpoint: { select: { nameAr: true, day: true } },
      },
    }),
  ]);

  if (!user) redirect('/login');

  const STAMP = new Intl.DateTimeFormat('ar-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const days = daysUntilConference();
  const start = dateOf(CONFERENCE_DAYS.dayOne);
  const end = dateOf(CONFERENCE_DAYS.dayTwo);
  const sameMonth = CONFERENCE_DAYS.dayOne.m === CONFERENCE_DAYS.dayTwo.m;
  const range = sameMonth
    ? `${DAY_ONLY.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`
    : `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`;

  return (
    <div dir="rtl">
      <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
        بطاقتي
      </h1>
      <p className="mt-1.5 mb-6 text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        بطاقتك الدائمة للمؤتمر — يُمسح رمز QR عليها عند الدخول فيُسجَّل حضورك تلقائياً.
      </p>

      {!user.confirmationCode && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, #f59e0b 10%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
          }}
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            لم يصدر رمز التأكيد المكتوب على بطاقتك بعد. رمز QR يعمل الآن ويكفي لتسجيل حضورك عند
            البوابة — أما الرمز المكتوب فيظهر بمجرد اعتماد تسجيلك.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        {/* Exactly one badge on the page — downloadBadgePDF targets the
            hardcoded DOM id `cic-badge-card`. */}
        <div className="flex justify-center">
          <DashboardBadge
            name={user.name ?? ''}
            categoryId={user.category ?? 'visitor'}
            categoryLabel={categoryLabel(user.category, 'ar')}
            organization={user.organization ?? undefined}
            track={user.track ?? ''}
            code={user.confirmationCode ?? '—'}
            // Derived from the account id, not the confirmation code — so the
            // QR works even for an account whose code was never issued, which
            // is exactly the case the warning above is about.
            qrValue={badgeToken(session.user.id)}
            date={dict.ar.registerPage.date}
            location={dict.ar.registerPage.location}
          />
        </div>

        <div className="space-y-4">
          {/* The one action this page exists for, and the only one that is
              wanted while standing in a queue — so it sits above everything
              explaining the badge rather than below it. */}
          <GatePass
            qrValue={badgeToken(session.user.id)}
            code={user.confirmationCode ?? ''}
            name={user.name ?? ''}
          />

          {/* Where the badge has been scanned. Shown once there is a door to
              have walked through: before that it can only be empty, and an
              empty list is not a record of anything. */}
          {(attendance.length > 0 || conferenceHasStarted()) && (
            <section
              className="rounded-2xl p-5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
            >
              <h2 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
                سجلّ حضورك
              </h2>

              {attendance.length === 0 ? (
                <p className="mt-2.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  لم يُسجَّل حضورك بعد. اعرض رمز QR عند البوابة وسيظهر هنا فوراً.
                </p>
              ) : (
                <ul className="mt-3.5 space-y-3">
                  {attendance.map((row) => (
                    <li key={row.id} className="flex items-start gap-3">
                      <CircleCheck
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: 'var(--accent-cyan)' }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block text-[13px] font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {row.checkpoint.nameAr}
                        </span>
                        <span
                          className="mt-0.5 block text-[11.5px]"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {dayLabel(row.checkpoint.day)} · {STAMP.format(row.checkedInAt)} ·{' '}
                          {ATTENDANCE_METHOD_LABELS[row.method]}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* When and where it will be asked for. */}
          <section
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <h2 className="font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
              متى تحتاجها
            </h2>

            <div className="mt-3.5 space-y-2.5">
              <p className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <CalendarClock className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-violet)' }} />
                {range}
                {days > 0 && (
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    · بعد {arabicCountBare(days, DAY)}
                  </span>
                )}
              </p>
              <p className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-violet)' }} />
                {dict.ar.registerPage.location}
              </p>
            </div>
          </section>

          <section
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
          >
            <h2 className="mb-4 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
              كيف تستخدمها
            </h2>
            <ul className="space-y-4">
              <Tip
                icon={Smartphone}
                title="احتفظ بها على هاتفك"
                body="حمّل نسخة PDF واحفظها في هاتفك — لا تحتاج اتصالاً بالإنترنت يوم الحضور."
              />
              <Tip
                icon={ScanLine}
                title="رمز QR يسجّل حضورك"
                body="اعرض الرمز على الشاشة أو على الورقة عند البوابة — يُمسح في ثانية ويصلك إشعار فور تسجيل حضورك."
              />
              <Tip
                icon={Printer}
                title="أو اطبعها ورقياً"
                body="البطاقة بمقاس الشارات المعتمد، فتُطبع وتُعلّق كما هي."
              />
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
