import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth-guards';
import { redirect } from 'next/navigation';
import StatCard from '@/components/admin/StatCard';
import { ListPageHeader } from '@/components/admin/ListPage';
import {
  USERS_PAGE_SIZE,
  parseUserFilters,
  userFiltersToQuery,
  userOrderBy,
  userWhere,
  type UserSearchParams,
} from '@/lib/admin-users';
import UsersFilters from './UsersFilters';
import UsersTable, { type UserRow } from './UsersTable';

interface Props {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<UserSearchParams>;
}

/** One end of the pager. Rendered inert rather than hidden, so it never jumps. */
function PageLink({ href, label, icon: Icon, disabled }: {
  href: string; label: string; icon: typeof ArrowRight; disabled: boolean;
}) {
  const style = {
    background: 'var(--mat-liquid-bg)',
    border: '1px solid var(--mat-liquid-border)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    opacity: disabled ? 0.45 : 1,
  };
  const className = 'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold';

  if (disabled) {
    return (
      <span className={className} style={style} aria-disabled>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  // The layout above already guarantees this; reading it here is for the
  // "this is you" marker in the table, not for access.
  if (!admin) redirect('/admin/login');

  const filters = parseUserFilters(await searchParams);
  const where = userWhere(filters);

  const [total, users, counts, attendeeCount, adminCount, presentCount, countryGroups] =
    await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: userOrderBy(filters.sort),
        skip: (filters.page - 1) * USERS_PAGE_SIZE,
        take: USERS_PAGE_SIZE,
        select: {
          id: true, name: true, email: true, phone: true, country: true, organization: true,
          role: true, category: true, confirmationCode: true, createdAt: true,
          _count: { select: { submissions: true, savedSessions: true, attendance: true } },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ATTENDEE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      // Distinct people seen at any checkpoint — not a count of scans, which
      // would exceed the number of attendees the moment day two starts.
      prisma.user.count({ where: { attendance: { some: {} } } }),
      prisma.user.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
        take: 60,
      }),
    ]);

  const pageCount = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    country: u.country,
    organization: u.organization,
    role: u.role,
    category: u.category,
    confirmationCode: u.confirmationCode,
    // Serialized for the Client Component below — a Date would cross the
    // boundary fine, but the string is what the cell renders anyway.
    createdAt: u.createdAt.toISOString(),
    submissions: u._count.submissions,
    savedSessions: u._count.savedSessions,
    attendance: u._count.attendance,
  }));

  const countries = countryGroups
    .map((g) => g.country)
    .filter((c): c is string => Boolean(c && c.trim()));

  return (
    <div>
      <ListPageHeader
        title="المستخدمون"
        description="كل من له حساب على المنصة — المشاركون والمديرون، مع حالة حضورهم الفعلي في المؤتمر."
      />

      <div className="mb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="كل الحسابات" value={counts} icon={Users} />
        <StatCard label="المشاركون" value={attendeeCount} icon={UserPlus} />
        <StatCard label="المديرون" value={adminCount} icon={ShieldCheck} />
        <StatCard
          label="حضروا فعلياً"
          value={presentCount}
          icon={UserCheck}
          accent={presentCount > 0 ? 'var(--accent-cyan)' : undefined}
          hint={attendeeCount > 0 ? `من ${attendeeCount} مشارك` : undefined}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <UserPlus className="h-4 w-4" />
          إنشاء حساب
        </Link>

        {/* Carries the current filters, so the file is the filtered list —
            every row matching it, not just this page, and not the whole
            directory under a filtered heading. */}
        <a
          href={`/admin/users/export${userFiltersToQuery(filters)}`}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{
            background: 'var(--mat-liquid-bg)',
            border: '1px solid var(--mat-liquid-border)',
            color: 'var(--text-primary)',
          }}
        >
          <Download className="h-4 w-4" />
          تصدير CSV
        </a>
      </div>

      <UsersFilters filters={filters} countries={countries} resultCount={total} />

      <UsersTable rows={rows} currentAdminId={admin.id} />

      {pageCount > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <PageLink
            href={`/admin/users${userFiltersToQuery(filters, { page: page - 1 })}`}
            label="السابق"
            icon={ArrowRight}
            disabled={page <= 1}
          />
          <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
            صفحة {page} من {pageCount}
          </p>
          <PageLink
            href={`/admin/users${userFiltersToQuery(filters, { page: page + 1 })}`}
            label="التالي"
            icon={ArrowLeft}
            disabled={page >= pageCount}
          />
        </div>
      )}
    </div>
  );
}
