import Link from 'next/link';
import { ClipboardList, Download, Search, UserCheck, X } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import Pagination from '@/components/admin/Pagination';
import StatCard from '@/components/admin/StatCard';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { LIST_PAGE_SIZE, listHref, pageCountFor } from '@/lib/admin-list';
import {
  isRegistrationFiltered,
  parseRegistrationFilters,
  registrationWhere,
  type RegistrationSearchParams,
} from '@/lib/admin-registrations';
import { deleteRegistration } from './actions';

interface Props {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<RegistrationSearchParams>;
}

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  // Parsed through the same helpers the CSV export uses, so "export" can only
  // ever mean "this list".
  const filters = parseRegistrationFilters(await searchParams);
  const { q: query, category, linked, page } = filters;
  const where = registrationWhere(filters);

  const [total, registrations, allCount, unlinkedCount] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * LIST_PAGE_SIZE,
      take: LIST_PAGE_SIZE,
      select: {
        id: true, fullName: true, email: true, phone: true, country: true,
        category: true, confirmationCode: true, submittedAt: true, userId: true,
      },
    }),
    prisma.registration.count(),
    prisma.registration.count({ where: { userId: null } }),
  ]);

  const pageCount = pageCountFor(total);
  const current = Math.min(page, pageCount);
  const filtered = isRegistrationFiltered(filters);

  const href = (overrides: Record<string, string | number | undefined>) =>
    listHref('/admin/registrations', { q: query, category, linked, page: current, ...overrides });

  const chips = [
    { key: 'category', value: '', label: 'كل الفئات', active: !category },
    ...CATEGORIES.map((c) => ({
      key: 'category',
      value: c.id,
      label: c.labels.ar,
      active: category === c.id,
    })),
    { key: 'linked', value: 'no', label: 'بلا حساب', active: linked === 'no' },
  ];

  return (
    <div>
      <ListPageHeader
        title="التسجيلات"
        description="كل من ملأ نموذج التسجيل — بما فيهم من سجّلوا قبل وجود الحسابات."
      />

      <div className="mb-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="كل التسجيلات" value={allCount} icon={ClipboardList} />
        <StatCard label="لها حساب" value={allCount - unlinkedCount} icon={UserCheck} />
        <StatCard
          label="بلا حساب"
          value={unlinkedCount}
          icon={X}
          // The only figure here that asks for an action: these people cannot
          // sign in or be scanned at the door until an account is created.
          accent={unlinkedCount > 0 ? 'var(--accent-violet)' : undefined}
          hint={unlinkedCount > 0 ? 'لا يمكنهم تسجيل الدخول' : undefined}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* A GET form, so every filtered view has a URL that can be shared —
            and so the export below is handed exactly what is on screen. */}
        <form method="GET" className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ insetInlineStart: 12, color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="ابحث بالاسم، البريد، الهاتف، الجهة أو رمز التأكيد..."
            className="input-glass"
            style={{ paddingInlineStart: 38 }}
          />
          {/* Carried through the search so submitting it does not silently
              clear the filter chips the admin already picked. */}
          {category && <input type="hidden" name="category" value={category} />}
          {linked && <input type="hidden" name="linked" value={linked} />}
        </form>

        {/* Carries the current filters, so the file is the filtered list —
            every row matching it, not just this page. */}
        <a
          href={listHref('/admin/registrations/export', { q: query, category, linked })}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Download className="h-4 w-4" />
          تصدير CSV
        </a>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chips.map((f) => (
          <Link
            key={`${f.key}-${f.value || 'all'}`}
            // Changing a filter returns to page one: page 4 of a narrower
            // result set is usually empty, which reads as "no matches".
            href={href({
              [f.key]: f.value || undefined,
              ...(f.key === 'category' ? {} : { category }),
              page: undefined,
            })}
            className="rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: f.active ? 'var(--primary)' : 'var(--mat-liquid-bg)',
              color: f.active ? 'var(--primary-foreground)' : 'var(--text-secondary)',
              border: '1px solid var(--mat-liquid-border)',
            }}
          >
            {f.label}
          </Link>
        ))}

        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          {filtered ? `${total} نتيجة` : `${total} تسجيل`}
        </p>

        {filtered && (
          <Link
            href="/admin/registrations"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: 'var(--accent-violet)' }}
          >
            <X className="h-3.5 w-3.5" />
            مسح التصفية
          </Link>
        )}
      </div>

      <ListTable>
        <tbody>
          {registrations.length === 0 && (
            <EmptyRow
              colSpan={7}
              label={filtered ? 'لا توجد نتائج مطابقة' : 'لا يوجد تسجيلات بعد'}
            />
          )}
          {registrations.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                {r.fullName}
                {!r.userId && (
                  <span className="block text-[11px]" style={{ color: 'var(--accent-violet)' }}>
                    بلا حساب
                  </span>
                )}
              </td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }} dir="ltr">{r.email}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }} dir="ltr">{r.phone || '—'}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>{r.country || '—'}</td>
              <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                {categoryLabel(r.category, 'ar') || r.category}
              </td>
              <td className="p-3 w-28" style={{ color: 'var(--text-tertiary)' }}>
                {new Date(r.submittedAt).toLocaleDateString('ar')}
              </td>
              <td className="p-3 w-16">
                <div className="flex items-center justify-end">
                  <DeleteButton
                    action={deleteRegistration.bind(null, r.id)}
                    confirmText={`حذف تسجيل «${r.fullName}» نهائياً؟`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>

      <Pagination page={current} pageCount={pageCount} buildHref={(p) => href({ page: p })} />
    </div>
  );
}
