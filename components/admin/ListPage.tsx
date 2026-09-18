import Link from 'next/link';
import { Plus } from 'lucide-react';

export function ListPageHeader({ title, description, addHref, addLabel = 'إضافة' }: { title: string; description?: string; addHref?: string; addLabel?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {description && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      {addHref && (
        <Link
          href={addHref}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Link>
      )}
    </div>
  );
}

export function ListTable({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {/* The rounded corners need `overflow-hidden` on the box above, which on
          its own *clips* a table too wide for the screen — several of these
          have seven columns, so on a phone the last ones were unreachable.
          The scroll lives on this inner element instead, and min-width keeps
          the columns from being crushed into unreadable slivers. */}
      <div className="overflow-x-auto">
        <table className="platform-table w-full text-[13.5px]" style={{ minWidth: '34rem' }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, label = 'لا يوجد محتوى بعد' }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-10 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </td>
    </tr>
  );
}
