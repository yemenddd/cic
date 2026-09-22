import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { canVolunteer, categoryLabel } from '@/lib/categories';

/**
 * The rota belongs to the volunteer tier (see lib/categories.ts).
 *
 * Every page under /dashboard/volunteering calls this. The nav link is already
 * hidden for other categories, but a hidden link is not access control — the
 * URL is still typeable and the route still renders.
 *
 * Returns the volunteer's id when they're entitled, or null when they aren't,
 * so the caller can render <NotEntitled /> rather than a 404: a visitor who
 * followed a link did nothing wrong, and a blank "not found" leaves them
 * guessing.
 */
export async function volunteerAccess(): Promise<
  { userId: string; committee: string | null } | { userId: null; category: string | null }
> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { category: true, committee: true },
  });
  if (!user) redirect('/login');

  if (!canVolunteer(user.category)) {
    return { userId: null, category: user.category };
  }
  // The committee comes back with the entitlement because every caller needs
  // both, and asking twice would be two round trips for one row.
  return { userId: session.user.id, committee: user.committee };
}

export function NotEntitled({ category }: { category: string | null }) {
  const label = categoryLabel(category, 'ar');

  return (
    <div>
      <h1 className="font-outfit font-bold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
        تطوّعي
      </h1>

      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--mat-liquid-bg)' }}
        >
          <Lock className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
        </div>

        <p className="font-semibold text-[15px] mb-2" style={{ color: 'var(--text-primary)' }}>
          جدول التطوّع متاح لفئة «متطوع»
        </p>
        <p className="text-[13.5px] leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          {label
            ? `فئتك الحالية هي «${label}»، والمساهمة في تنظيم المؤتمر مخصّصة للمتطوعين.`
            : 'فئتك الحالية لا تشمل المساهمة في تنظيم المؤتمر.'}{' '}
          للانضمام إلى فريق التطوّع، تواصل مع فريق تنظيم المؤتمر.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          العودة إلى لوحتي
        </Link>
      </div>
    </div>
  );
}
