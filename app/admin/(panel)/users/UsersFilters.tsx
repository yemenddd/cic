'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { CATEGORY_NONE, USER_SORTS, type UserFilters } from '@/lib/admin-users';

/**
 * The filter bar above the directory.
 *
 * A plain GET form, so every filtered view has a URL that can be bookmarked,
 * shared with the colleague on the other side of the desk, and — the reason it
 * matters most — handed to the CSV export unchanged. The selects submit
 * themselves on change; the text box waits for Enter, because re-running the
 * query on every keystroke is a request per letter for no gain.
 */
export default function UsersFilters({
  filters,
  countries,
  resultCount,
}: {
  filters: UserFilters;
  countries: string[];
  resultCount: number;
}) {
  const form = useRef<HTMLFormElement>(null);

  // Changing any filter returns to the first page: page 4 of a narrower result
  // set is usually empty, which reads as "no matches" rather than "past the end".
  const submit = () => form.current?.requestSubmit();

  const selectClass = 'input-glass';
  const selectStyle = { padding: '9px 12px', fontSize: '13px' } as const;

  const active =
    Boolean(filters.q || filters.role || filters.category || filters.country || filters.attendance);

  return (
    <form ref={form} method="GET" className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ insetInlineStart: 12, color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            name="q"
            defaultValue={filters.q}
            placeholder="ابحث بالاسم، البريد، الهاتف، الجهة أو رمز التأكيد..."
            className="input-glass"
            style={{ paddingInlineStart: 38 }}
          />
        </div>

        <select name="role" defaultValue={filters.role} onChange={submit} className={selectClass} style={{ ...selectStyle, width: 'auto' }}>
          <option value="">كل الصلاحيات</option>
          <option value="ADMIN">المديرون</option>
          <option value="ATTENDEE">المشاركون</option>
        </select>

        <select name="category" defaultValue={filters.category} onChange={submit} className={selectClass} style={{ ...selectStyle, width: 'auto' }}>
          <option value="">كل الفئات</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.labels.ar}</option>
          ))}
          <option value={CATEGORY_NONE}>بلا فئة</option>
        </select>

        <select name="attendance" defaultValue={filters.attendance} onChange={submit} className={selectClass} style={{ ...selectStyle, width: 'auto' }}>
          <option value="">الحضور: الكل</option>
          <option value="present">حضروا فعلياً</option>
          <option value="absent">لم يحضروا</option>
        </select>

        {/* Only offered when there is something to choose between — a
            single-option country filter is a control that does nothing. */}
        {countries.length > 1 && (
          <select name="country" defaultValue={filters.country} onChange={submit} className={selectClass} style={{ ...selectStyle, width: 'auto' }}>
            <option value="">كل الدول</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select name="sort" defaultValue={filters.sort} onChange={submit} className={selectClass} style={{ ...selectStyle, width: 'auto' }}>
          {USER_SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Keeps the form submittable by keyboard without a visible button
            competing with the selects for attention. */}
        <button type="submit" className="sr-only">تطبيق</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          {active ? `${resultCount} نتيجة مطابقة` : `${resultCount} حساب`}
        </p>
        {active && (
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: 'var(--accent-violet)' }}
          >
            <X className="h-3.5 w-3.5" />
            مسح عوامل التصفية
          </Link>
        )}
      </div>
    </form>
  );
}
