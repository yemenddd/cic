import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * The pager under a panel list.
 *
 * Shared because three lists now need one and the first of them had it
 * inline — which is how the second and third end up with subtly different
 * edge-case behaviour at the ends of the range.
 *
 * `basePath` plus `query` rather than a ready-made href, so a caller cannot
 * accidentally drop the filters it was showing when it builds the link to the
 * next page — the filters are the part that is easy to lose.
 */
export default function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  /** Given a page number, the URL for it — filters included. */
  buildHref: (page: number) => string;
}) {
  // One page is not a range to move through; rendering an all-disabled pager
  // under it is a control that exists only to be unusable.
  if (pageCount <= 1) return null;

  return (
    <nav className="mt-5 flex items-center justify-between gap-3" aria-label="تنقّل بين الصفحات">
      <PageLink href={buildHref(page - 1)} label="السابق" icon={ArrowRight} disabled={page <= 1} />

      <p className="text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>
        صفحة {page} من {pageCount}
      </p>

      <PageLink href={buildHref(page + 1)} label="التالي" icon={ArrowLeft} disabled={page >= pageCount} />
    </nav>
  );
}

/** One end of the pager. Rendered inert rather than hidden, so it never jumps. */
function PageLink({
  href,
  label,
  icon: Icon,
  disabled,
}: {
  href: string;
  label: string;
  icon: typeof ArrowRight;
  disabled: boolean;
}) {
  const className =
    'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold';
  const style = {
    background: 'var(--mat-liquid-bg)',
    border: '1px solid var(--mat-liquid-border)',
    color: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    opacity: disabled ? 0.45 : 1,
  };

  if (disabled) {
    return (
      <span className={className} style={style} aria-disabled="true">
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
