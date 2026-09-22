'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react';
import type { UserRole } from '@prisma/client';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { EmptyRow, ListTable } from '@/components/admin/ListPage';
import RoleChip from './RoleChip';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { bulkDeleteUsers, bulkSetCategory } from './actions';

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  organization: string | null;
  role: UserRole;
  category: string | null;
  confirmationCode: string | null;
  createdAt: string;
  submissions: number;
  savedSessions: number;
  attendance: number;
}

function Cell({ children, width, color = 'var(--text-secondary)', dir }: {
  children: React.ReactNode; width?: string; color?: string; dir?: 'ltr' | 'rtl';
}) {
  return (
    <td className={`p-3 ${width ?? ''}`} style={{ color }} dir={dir}>
      {children}
    </td>
  );
}

/** Present / not yet — the one fact the desk asks for on the day. */
function AttendanceChip({ count }: { count: number }) {
  const present = count > 0;
  const color = present ? 'var(--accent-cyan)' : 'var(--text-tertiary)';

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {present ? <UserCheck className="h-3 w-3" /> : null}
      {present ? (count > 1 ? `حضر · ${count}` : 'حضر') : 'لم يحضر'}
    </span>
  );
}

/**
 * The directory table, and the bar that appears once rows are selected.
 *
 * Selection is client state, so this half is a Client Component while the
 * query that produced the rows stays on the server. The bulk actions are the
 * reason it exists: changing the tier of forty people who were all registered
 * under the wrong one is otherwise forty page loads.
 */
export default function UsersTable({ rows, currentAdminId }: { rows: UserRow[]; currentAdminId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const confirm = useConfirm();

  // A page change replaces `rows`, so anything selected on the previous page
  // is no longer on screen. Intersecting keeps the count honest rather than
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

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function run(fn: () => Promise<{ error?: string; success?: string }>) {
    setNotice(null);
    startTransition(async () => {
      const result = await fn();
      if (result?.error) {
        setNotice({ tone: 'error', text: result.error });
        return;
      }
      if (result?.success) {
        setNotice({ tone: 'success', text: result.success });
        setSelected(new Set());
      }
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

          <span className="mx-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            غيّر الفئة إلى
          </span>

          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={pending}
              onClick={async () => {
                const ok = await confirm({
                  title: `تغيير فئة ${ids.length} مستخدماً إلى «${c.labels.ar}»؟`,
                  body: 'تتغيّر معها المزايا المتاحة لهم — تقديم الأعمال متاح لفئة «مشارك» فقط.',
                  confirmLabel: 'تغيير الفئة',
                });
                if (!ok) return;
                run(() => bulkSetCategory(ids, c.id));
              }}
              className="rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-primary)',
              }}
            >
              {c.labels.ar}
            </button>
          ))}

          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const ok = await confirm({
                title: `حذف ${ids.length} مستخدماً نهائياً؟`,
                body: 'ستُحذف معهم ابتكاراتهم وجلساتهم المحفوظة وسجل حضورهم. لا يمكن التراجع.',
                confirmLabel: 'حذف نهائي',
                tone: 'danger',
              });
              if (!ok) return;
              run(() => bulkDeleteUsers(ids));
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
                onChange={toggleAll}
                aria-label="تحديد كل الصف في هذه الصفحة"
                style={{ accentColor: 'var(--accent-violet)', width: 15, height: 15 }}
              />
            </th>
            {['المستخدم', 'الصلاحية', 'الفئة', 'الحضور', 'النشاط', 'الانضمام', ''].map((h, i) => (
              <th
                key={i}
                className="p-3 text-start text-[11.5px] font-semibold"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={8} label="لا توجد نتائج مطابقة" />}

          {rows.map((u) => {
            const isSelected = selected.has(u.id);
            return (
              <tr
                key={u.id}
                style={{
                  borderTop: '1px solid var(--mat-liquid-border)',
                  background: isSelected ? 'color-mix(in srgb, var(--accent-violet) 7%, transparent)' : undefined,
                }}
              >
                <td className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(u.id)}
                    aria-label={`تحديد ${u.name || u.email}`}
                    style={{ accentColor: 'var(--accent-violet)', width: 15, height: 15 }}
                  />
                </td>

                <Cell color="var(--text-primary)">
                  <span className="flex items-center gap-1.5">
                    {u.name || '—'}
                    {u.id === currentAdminId && (
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent-violet)' }} aria-label="حسابك" />
                    )}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
                    {u.email}
                  </span>
                </Cell>

                <Cell width="w-24"><RoleChip role={u.role} /></Cell>

                <Cell>{categoryLabel(u.category, 'ar') || '—'}</Cell>

                <Cell width="w-28"><AttendanceChip count={u.attendance} /></Cell>

                <Cell width="w-40" color="var(--text-tertiary)">
                  {u.submissions} ابتكار · {u.savedSessions} جلسة
                </Cell>

                <Cell width="w-28" color="var(--text-tertiary)">
                  {new Date(u.createdAt).toLocaleDateString('ar')}
                </Cell>

                <td className="p-3 w-16">
                  <div className="flex items-center justify-end">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="p-1.5 rounded-lg"
                      style={{ color: 'var(--text-tertiary)' }}
                      aria-label="عرض"
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
