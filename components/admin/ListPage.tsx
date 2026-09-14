import Link from 'next/link';
import { Plus } from 'lucide-react';

export function ListPageHeader({ title, addHref, addLabel = 'إضافة' }: { title: string; addHref?: string; addLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      {addHref && (
        <Link
          href={addHref}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#0d0d0f' }}
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
      style={{ background: '#161618', border: '1px solid var(--mat-liquid-border)' }}
    >
      <table className="w-full text-[13.5px]">{children}</table>
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
