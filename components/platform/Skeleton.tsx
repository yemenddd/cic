/**
 * The shapes a panel draws while its page's query runs.
 *
 * Next.js streams a `loading.tsx` in place of the page the instant a
 * navigation starts, then swaps the real content in when the server is done.
 * Without one the browser simply sits on the previous page — every link in
 * both panels felt like it had not registered the click, on queries that take
 * a few hundred milliseconds against a pooled Postgres in another region.
 *
 * These are skeletons rather than a spinner on purpose: they show the shape of
 * what is arriving, so the page does not jump when it does, and they make the
 * wait feel like loading rather than like nothing happening.
 *
 * Everything here is aria-hidden and the wrapper carries the live region —
 * a screen reader should hear "جارٍ التحميل" once, not read out two dozen
 * meaningless boxes.
 */

export function SkeletonLine({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />;
}

export function SkeletonCard({ height = 96 }: { height?: number }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)', height }}
    >
      <SkeletonLine width="45%" height={10} />
      <div className="mt-4">
        <SkeletonLine width="60%" height={22} />
      </div>
    </div>
  );
}

/** The frame every panel loading state sits in. */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" dir="rtl">
      <span className="sr-only">جارٍ التحميل…</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** Title + optional subtitle, matching ListPageHeader's rhythm. */
export function SkeletonHeader() {
  return (
    <div className="mb-6">
      <SkeletonLine width={180} height={20} />
      <div className="mt-2.5">
        <SkeletonLine width={320} height={11} />
      </div>
    </div>
  );
}

/** A stand-in for one of the panel's list tables. */
export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4"
          style={{ borderTop: i === 0 ? undefined : '1px solid var(--mat-liquid-border)' }}
        >
          <SkeletonLine width="28%" height={13} />
          <SkeletonLine width="22%" height={11} />
          <SkeletonLine width={70} height={22} />
          {/* Rows fade toward the end of the list: the eye reads the block as
              one loading surface instead of as a finished table of empty rows. */}
          <div className="ms-auto" style={{ opacity: 1 - i * 0.07 }}>
            <SkeletonLine width={90} height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}
