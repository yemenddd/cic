// The card every breakdown on /admin/insights sits in, plus the one line a
// section shows when it has nothing to draw.

export function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <header className="mb-4">
        <h2 className="font-outfit font-semibold text-[14.5px]" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {caption && (
          <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
            {caption}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export function EmptyNote({ label = 'لا توجد بيانات بعد' }: { label?: string }) {
  return (
    <p className="py-8 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
      {label}
    </p>
  );
}
