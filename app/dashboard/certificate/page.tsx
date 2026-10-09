import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Award, ShieldCheck, ArrowLeft, CircleCheck, TriangleAlert, Clock,
} from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { dict } from '@/lib/dictionary';
import { conferenceHasEnded, EDITION_DATE_AR, EDITION_DATE_EN } from '@/lib/conference';
import { certificateReadiness, type CertificateIssueLevel } from '@/lib/certificate-readiness';
import { totalHours } from '@/lib/volunteering';
import ParticipationCertificate from '@/components/dashboard/ParticipationCertificate';

const ISSUE_STYLE: Record<CertificateIssueLevel, { icon: typeof Award; color: string }> = {
  blocking: { icon: TriangleAlert, color: 'var(--destructive)' },
  degraded: { icon: TriangleAlert, color: 'var(--accent-violet)' },
  pending: { icon: Clock, color: 'var(--text-tertiary)' },
};

export const metadata: Metadata = {
  title: 'شهادتي | CIC',
  robots: { index: false, follow: false },
};

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
      committee: true,
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

  // What a participant actually presented. Only the works the committee
  // accepted: a certificate that named a rejected submission would be the
  // platform vouching for something the committee declined.
  const approved = user.category === 'participant'
    ? await prisma.projectSubmission.findMany({
        where: { userId: session.user.id, status: 'APPROVED' },
        orderBy: { submittedAt: 'asc' },
        select: { titleAr: true, titleEn: true },
      })
    : [];

  /**
   * Whether this person was ever counted through a door.
   *
   * The certificate states in the past tense that its holder attended, and
   * carries the organising committee's name and seal. Two different things
   * could make that false, and until now only one of them was checked: the
   * conference not having happened yet, and the holder not having come.
   *
   * Registering was enough to obtain one, which is precisely what devalues it
   * for the people who did turn up — and the platform had the answer all
   * along, in the rows the scanners wrote at the gates.
   *
   * Any checkpoint counts, on either day: somebody who came for one day
   * attended, and the sheet does not claim otherwise.
   */
  const attendances = await prisma.attendance.count({ where: { userId: session.user.id } });
  const attended = attendances > 0;

  const ended = conferenceHasEnded();

  /**
   * A volunteer is not counted the way an attendee is.
   *
   * The gate is where attendees are proved, and for most people it is the
   * only proof there is. A volunteer is the exception: they are the ones
   * holding the scanner, letting people in through a side door, or on a shift
   * that started before the gate opened — and five of ours finished two days
   * of work with no row against their name. Refusing them the certificate for
   * the committee they served on would be the platform reading its own
   * records backwards.
   *
   * Being an approved volunteer is itself the organizers' decision that this
   * person was on the team, which is what their certificate attests to. The
   * dashboard only opens for an approved account at all, so reaching this
   * page as a volunteer is the whole of the test.
   */
  const isVolunteerTier = user.category === 'volunteer';
  const available = ended && (attended || isVolunteerTier);

  const readiness = certificateReadiness({
    name: user.name,
    track: user.track,
    confirmationCode: user.confirmationCode,
  });

  // `ended` is now permanently true — the edition this certificate attests to
  // is in the past — so the "شهادتك تصدر بعد المؤتمر" half of this screen can
  // never be reached. Reaching here means only one thing: no scan at any gate.
  if (!available) {
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
              لم نسجّل حضورك في المؤتمر
            </h2>

            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {`${kind} تشهد بحضورك فعلياً، وتُصدر لمن مُسحت بطاقته عند إحدى بوابات المؤتمر. لا يوجد لحسابك تسجيل حضور.`}
            </p>

            {/* Somebody who was there and was never scanned is a real case —
                a desk misses people — and the honest answer to them is a way
                to be counted, not a closed door. */}
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                إن كنت قد حضرت ولم يُمسح رمزك عند الباب، راسلنا بالرد على أي رسالة وصلتك من
                المؤتمر ومعها رمز تأكيدك{user.confirmationCode ? ' ' : ''}
                {user.confirmationCode && (
                  <span dir="ltr" style={{ unicodeBidi: 'isolate', fontWeight: 600 }}>
                    {user.confirmationCode}
                  </span>
                )}
                ، وسنراجع سجل البوابة.
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
            committee={user.committee}
            projectTitle={approved[0]?.titleAr ?? null}
            projectTitleEn={approved[0]?.titleEn ?? null}
            approvedProjects={approved.length}
            date={EDITION_DATE_AR}
            dateEn={EDITION_DATE_EN}
            location={dict.ar.registerPage.location}
            locationEn={dict.en.registerPage.location}
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

      {/* The sheet drops the committee clause rather than inventing one, so a
          volunteer whose committee was never set downloads a certificate that
          is quietly missing the line naming what they did. Said here, where
          there is still time to fix it. */}
      {user.category === 'volunteer' && !user.committee && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, #f59e0b 10%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
          }}
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            لجنتك غير محددة في حسابك، ولذلك لا تذكرها الشهادة. حدّدها من{' '}
            <Link href="/dashboard/volunteering" className="font-semibold underline">
              صفحة التطوّع
            </Link>{' '}
            ثم أعد تحميل الشهادة.
          </p>
        </div>
      )}

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
          committee={user.committee}
          projectTitle={approved[0]?.titleAr ?? null}
          projectTitleEn={approved[0]?.titleEn ?? null}
          approvedProjects={approved.length}
          date={EDITION_DATE_AR}
          dateEn={EDITION_DATE_EN}
          location={dict.ar.registerPage.location}
          locationEn={dict.en.registerPage.location}
          issuedAt={issuedAt}
        />
      </div>
    </div>
  );
}
