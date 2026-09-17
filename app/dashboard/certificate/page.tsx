import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { dict } from '@/lib/dictionary';
import ParticipationCertificate from '@/components/dashboard/ParticipationCertificate';

export const metadata: Metadata = {
  title: 'شهادتي | CICT 2026',
  robots: { index: false, follow: false },
};

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

  return (
    <div dir="rtl">
      <h1 className="font-outfit font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
        شهادتي
      </h1>
      <p className="text-[13.5px] mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {isVolunteer
          ? 'هذه شهادة التطوع الخاصة بك. حمّلها بصيغة PDF واحتفظ بها، ويمكن التحقق منها عبر رمز التحقق المطبوع عليها.'
          : 'هذه شهادة المشاركة الخاصة بك. حمّلها بصيغة PDF واحتفظ بها، ويمكن التحقق منها عبر رمز التحقق المطبوع عليها.'}
      </p>

      {!user.confirmationCode && (
        <div
          className="rounded-2xl p-4 mb-6 text-[12.5px] leading-relaxed"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-secondary)',
          }}
        >
          لم يصدر رمز التحقق الخاص بك بعد. ستظهر الشهادة برمزها الكامل بمجرد اعتماد تسجيلك.
        </div>
      )}

      {/* Exactly one certificate on the page — downloadCertificatePDF targets
          the hardcoded DOM id `cict-certificate`. */}
      <div className="py-2">
        <ParticipationCertificate
          name={user.name ?? ''}
          categoryId={user.category ?? 'visitor'}
          categoryLabel={categoryLabel(user.category, 'ar')}
          track={user.track ?? ''}
          code={user.confirmationCode ?? '—'}
          date={dict.ar.registerPage.date}
          location={dict.ar.registerPage.location}
          issuedAt={issuedAt}
        />
      </div>
    </div>
  );
}
