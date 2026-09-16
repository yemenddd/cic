import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { categoryLabel } from '@/lib/categories';
import { dict } from '@/lib/dictionary';
import DashboardBadge from '@/components/dashboard/DashboardBadge';

export const metadata = {
  title: 'بطاقتي | CICT 2026',
};

export default async function BadgePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // The attendee's own record — no safe() wrapper, so a DB failure surfaces
  // instead of quietly rendering an empty badge.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      category: true,
      organization: true,
      track: true,
      confirmationCode: true,
    },
  });

  if (!user) redirect('/login');

  return (
    <div dir="rtl">
      <h1 className="font-outfit font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
        بطاقتي
      </h1>
      <p className="text-[13.5px] mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        هذه بطاقتك الدائمة للمؤتمر. حمّلها أو احتفظ بها على هاتفك، وستحتاج رمز التأكيد عند الدخول.
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
          لم يصدر رمز التأكيد الخاص بك بعد. ستظهر البطاقة كاملة بمجرد اعتماد تسجيلك.
        </div>
      )}

      {/* Exactly one badge on the page — downloadBadgePDF targets the
          hardcoded DOM id `cict-badge-card`. */}
      <div className="flex justify-center py-2">
        <DashboardBadge
          name={user.name ?? ''}
          categoryId={user.category ?? 'visitor'}
          categoryLabel={categoryLabel(user.category, 'ar')}
          organization={user.organization ?? undefined}
          track={user.track ?? ''}
          code={user.confirmationCode ?? '—'}
          date={dict.ar.registerPage.date}
          location={dict.ar.registerPage.location}
        />
      </div>
    </div>
  );
}
