'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Copy, Eye, Trash2, TriangleAlert, X } from 'lucide-react';
import { categoryLabel } from '@/lib/categories';
import { EmptyRow, ListTable } from '@/components/admin/ListPage';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { bulkDeleteRegistrations } from './actions';

export interface RegistrationRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  category: string;
  submittedAt: string;
  hasAccount: boolean;
  /** This address appears on more than one registration. */
  duplicate: boolean;
}

export default function RegistrationsTable({
  rows,
  filtered,
}: {
  rows: RegistrationRow[];
  filtered: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const confirm = useConfirm();

  // A page change replaces `rows`, so anything selected on the previous page is
  // no longer on screen. Intersecting keeps the count honest rather than
  // claiming a selection the admin can no longer see or clear.
  const visible = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);
  const ids = useMemo(() => [...selected].filter((id) => visible.has(id)), [selected, visible]);
  const allSelected = rows.length > 0 && ids.length === rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {ids.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: 'color-mix(in srgb, var(--accent-violet) 8%, var(--bg-elevated))',
            border: '1px solid color-mix(in srgb, var(--accent-violet) 28%, transparent)',
          }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {ids.length} محدَّد
          </span>

          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: `حذف ${ids.length} تسجيلاً نهائياً؟`,
                body: 'تُحذف سجلات التسجيل فقط — الحسابات المرتبطة بها تبقى كما هي. لا يمكن التراجع.',
                confirmLabel: 'حذف نهائي',
                tone: 'danger',
              });
              if (!ok) return;
              setNotice(null);
              startTransition(async () => {
                const result = await bulkDeleteRegistrations(ids);
                if (result.error) {
                  setNotice({ tone: 'error', text: result.error });
                  return;
                }
                setNotice({ tone: 'success', text: result.success ?? '' });
                setSelected(new Set());
              });
            }}
            className="ms-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'transparent', border: '1px solid var(--mat-liquid-border)', color: 'var(--destructive)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف المحدد
          </button>

          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-lg p-1.5"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="إلغاء التحديد"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <p
          className="text-[12.5px]"
          style={{ color: notice.tone === 'error' ? 'var(--destructive)' : 'var(--accent-cyan)' }}
        >
          {notice.text}
        </p>
      )}

      <ListTable>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mat-liquid-border)' }}>
            <th className="p-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                aria-label="تحديد كل الصفوف في هذه الصفحة"
                style={{ accentColor: 'var(--accent-violet)', width: 15, height: 15 }}
              />
            </th>
            {['المسجَّل', 'الهاتف', 'الدولة', 'الفئة', 'تاريخ التسجيل', ''].map((h, i) => (
              <th key={i} className="p-3 text-start text-[11.5px] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <EmptyRow colSpan={7} label={filtered ? 'لا توجد نتائج مطابقة' : 'لا يوجد تسجيلات بعد'} />
          )}

          {rows.map((r) => {
            const isSelected = selected.has(r.id);
            return (
              <tr
                key={r.id}
                style={{
                  borderTop: '1px solid var(--mat-liquid-border)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent-violet) 7%, transparent)' : undefined,
                }}
              >
                <td className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(r.id)}
                    aria-label={`تحديد ${r.fullName}`}
                    style={{ accentColor: 'var(--accent-violet)', width: 15, height: 15 }}
                  />
                </td>

                <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {r.fullName}
                    {r.duplicate && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          color: '#f59e0b',
                          background: 'color-mix(in srgb, #f59e0b 14%, transparent)',
                          border: '1px solid color-mix(in srgb, #f59e0b 30%, transparent)',
                        }}
                        title="هذا البريد مسجَّل أكثر من مرة"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        مكرر
                      </span>
                    )}
                    {!r.hasAccount && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          color: 'var(--accent-violet)',
                          background: 'color-mix(in srgb, var(--accent-violet) 14%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)',
                        }}
                        title="لا يستطيع تسجيل الدخول ولا يملك بطاقة"
                      >
                        <TriangleAlert className="h-2.5 w-2.5" />
                        بلا حساب
                      </span>
                    )}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
                    {r.email}
                  </span>
                </td>

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
                    <Link
                      href={`/admin/registrations/${r.id}`}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label={`عرض تسجيل ${r.fullName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </ListTable>
    </div>
  );
}
