import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Award, CalendarClock, ShieldCheck, ArrowLeft, CircleCheck, TriangleAlert, Clock,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { dict } from '@/lib/dictionary';
import { CONFERENCE_DAYS, conferenceHasEnded, daysUntilConference } from '@/lib/conference';
import { arabicCountBare, DAY } from '@/lib/arabic-plural';
import { certificateReadiness, type CertificateIssueLevel } from '@/lib/certificate-readiness';
import { totalHours } from '@/lib/volunteering';
import ParticipationCertificate from '@/components/dashboard/ParticipationCertificate';

const ISSUE_STYLE: Record<CertificateIssueLevel, { icon: typeof Award; color: string }> = {
  blocking: { icon: TriangleAlert, color: 'var(--destructive)' },
  degraded: { icon: TriangleAlert, color: 'var(--accent-violet)' },
  pending: { icon: Clock, color: 'var(--text-tertiary)' },
};

export const metadata: Metadata = {
  title: 'شهادتي | CIC 2026',
  robots: { index: false, follow: false },
};

const DAY_ONLY = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric' });
const DAY_MONTH = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' });

function dateOf({ y, m, d }: { y: number; m: number; d: number }): Date {
  return new Date(y, m - 1, d);
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span
        className="min-w-0 truncate text-[13px] font-semibold"
        style={{
          color: 'var(--text-primary)',
          fontFamily: mono ? 'monospace' : undefined,
          letterSpacing: mono ? '0.08em' : undefined,
        }}
        dir={mono ? 'ltr' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export default async function CertificatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      category: true,
      track: true,
      confirmationCode: true,
      createdAt: true,
    },
  });

  if (!user) redirect('/login');

  // Formatted here so the client component only ever receives plain strings —
  // no Date crossing the boundary, no locale drift between server and client.
  const issuedAt = new Intl.DateTimeFormat('ar-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt);

  const isVolunteer = user.category === 'volunteer';
  const kind = isVolunteer ? 'شهادة التطوع' : 'شهادة المشاركة';

  // The hours a volunteering certificate attests to, summed from the rota by
  // the same helper the rota page uses. Asked only for volunteers — for the
  // other categories the answer would be zero and change nothing on the sheet.
  const volunteerHours = isVolunteer
    ? totalHours(
        (
          await prisma.volunteerAssignment.findMany({
            where: { userId: session.user.id },
            select: { shift: { select: { day: true, startTime: true, endTime: true } } },
          })
        ).map((a) => a.shift),
      ).hours
    : 0;

  /**
   * The certificate states in the past tense that its holder attended, and
   * carries the organising committee's name and seal. Issuing it before the
   * conference has happened would make it a false document — and one anybody
   * could obtain by registering, which is exactly what devalues it for the
   * people who do attend. So it is withheld until the event is actually over.
   */
  const available = conferenceHasEnded();

  const readiness = certificateReadiness({
    name: user.name,
    track: user.track,
    confirmationCode: user.confirmationCode,
  });

  if (!available) {
    const days = daysUntilConference();
    const start = dateOf(CONFERENCE_DAYS.dayOne);
    const end = dateOf(CONFERENCE_DAYS.dayTwo);
    const sameMonth = CONFERENCE_DAYS.dayOne.m === CONFERENCE_DAYS.dayTwo.m;
    const range = sameMonth
      ? `${DAY_ONLY.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`
      : `${DAY_MONTH.format(start)} – ${DAY_MONTH.format(end)} ${CONFERENCE_DAYS.dayTwo.y}`;

    // Wider than the 2xl this used to be: the page now holds an A4 landscape
    // sheet, which scales itself down to whatever it is given, and at 672px
    // the name on it was too small to proofread — which is the entire reason
    // it is here.
    return (
      <div dir="rtl" className="max-w-4xl">
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
          شهادتي
        </h1>
        <p className="mt-1.5 mb-6 text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {kind} الخاصة بك، وتصدر باسمك بعد انتهاء فعاليات المؤتمر.
        </p>

        <section
          className="rounded-2xl p-6 md:p-7"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <div>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' }}
            >
              <Award className="h-6 w-6" style={{ color: 'var(--accent-violet)' }} strokeWidth={1.6} />
            </span>

            <h2
              className="mt-4 font-outfit font-bold text-[17px]"
              style={{ color: 'var(--text-primary)' }}
            >
              {days > 0 ? 'شهادتك تصدر بعد المؤتمر' : 'شهادتك تصدر عند ختام الفعاليات'}
            </h2>

            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {kind} تشهد بحضورك فعلياً، ولذلك تُصدر بعد انتهاء الفعاليات لا قبلها — فبذلك
              تبقى لها قيمتها عند من يطّلع عليها.
            </p>

            <p
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-secondary)',
              }}
            >
              <CalendarClock className="h-3.5 w-3.5" style={{ color: 'var(--accent-violet)' }} />
              {range}
              {days > 0 && <span style={{ color: 'var(--text-tertiary)' }}>· بعد {arabicCountBare(days, DAY)}</span>}
            </p>
          </div>
        </section>

        {/* The real document, with this attendee's own values set in it.
            The page has always said "check your details" and then shown a
            four-row list, which looks the same whether a value is wrong or
            not. Seeing your own name typeset on the sheet is what makes a
            misspelling obvious, and there is still time to correct it.

            `preview` withholds the capture id, so this cannot be saved as a
            PDF before the conference has happened. */}
        <section
          className="mt-4 rounded-2xl p-5 md:p-6"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="mb-1 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
            هكذا ستبدو
          </h2>
          <p className="mb-4 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            معاينة ببياناتك الحالية. ما تراه هنا هو ما سيُطبع.
          </p>

          <ParticipationCertificate
            preview
            name={user.name ?? ''}
            categoryId={user.category ?? 'visitor'}
            categoryLabel={categoryLabel(user.category, 'ar')}
            track={user.track ?? ''}
            code={user.confirmationCode ?? '—'}
            volunteerHours={volunteerHours}
            date={dict.ar.registerPage.date}
            location={dict.ar.registerPage.location}
            issuedAt={issuedAt}
          />
        </section>

        {/* Whether it would come out right, before it is too late to fix. */}
        <section
          className="mt-4 rounded-2xl p-5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h2 className="mb-1 font-outfit font-bold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
            {readiness.ready ? 'بياناتك جاهزة للطباعة' : 'راجع هذه قبل الإصدار'}
          </h2>
          <p className="mb-4 text-[12px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {readiness.ready
              ? 'ما تراه في المعاينة أعلاه هو ما سيصدر باسمك تماماً.'
              : 'الشهادة تُطبع من بياناتك كما هي — وبعد إصدارها لا يمكن تعديلها.'}
          </p>

          {readiness.ready ? (
            <p
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ color: 'var(--accent-cyan)' }}
            >
              <CircleCheck className="h-4 w-4" />
              لا ينقص شيء.
            </p>
          ) : (
            <ul className="space-y-3">
              {readiness.issues.map((issue) => {
                const { icon: Icon, color } = ISSUE_STYLE[issue.level];
                return (
                  <li key={issue.key} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {issue.title}
                      </span>
                      <span
                        className="mt-0.5 block text-[12px] leading-relaxed"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {issue.consequence}
                      </span>
                      {issue.href && (
                        <Link
                          href={issue.href}
                          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ color: 'var(--accent-violet)' }}
                        >
                          أصلحها الآن
                          <ArrowLeft className="h-3 w-3" />
                        </Link>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* The values themselves still get said once, plainly. The list above
              is about what is wrong; this is the record of what is there. */}
          <div className="mt-5 divide-y" style={{ borderColor: 'var(--mat-liquid-border)' }}>
            <Detail label="الاسم" value={user.name?.trim() || 'غير محدد'} />
            <Detail label={isVolunteer ? 'صفة التطوع' : 'صفة المشاركة'} value={categoryLabel(user.category, 'ar') || 'غير محددة'} />
            {user.track && <Detail label="المسار" value={user.track} />}
            <Detail label="رمز التحقق" value={user.confirmationCode ?? 'يصدر بعد اعتماد التسجيل'} mono={Boolean(user.confirmationCode)} />
          </div>

          <Link
            href="/dashboard/account"
            className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{ color: 'var(--accent-violet)' }}
          >
            تعديل بياناتي
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
        شهادتي
      </h1>
      <p className="mt-1.5 mb-6 text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        {kind} الخاصة بك — حمّلها بصيغة PDF واحتفظ بها. رمز التحقق المطبوع عليها هو ما يرجع
        إليه فريق المؤتمر عند الاستفسار عنها.
      </p>

      {!user.confirmationCode && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, #f59e0b 10%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
          }}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            لم يصدر رمز التحقق الخاص بك بعد، وستظهر الشهادة برمزها الكامل بمجرد اعتماد تسجيلك.
          </p>
        </div>
      )}

      {/* Exactly one certificate on the page — downloadCertificatePDF targets
          the hardcoded DOM id `cic-certificate`. */}
      <div className="py-2">
        <ParticipationCertificate
          name={user.name ?? ''}
          categoryId={user.category ?? 'visitor'}
          categoryLabel={categoryLabel(user.category, 'ar')}
          track={user.track ?? ''}
          code={user.confirmationCode ?? '—'}
          volunteerHours={volunteerHours}
          date={dict.ar.registerPage.date}
          location={dict.ar.registerPage.location}
          issuedAt={issuedAt}
        />
      </div>
    </div>
  );
}
