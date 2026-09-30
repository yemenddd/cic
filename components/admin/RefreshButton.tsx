'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';

/**
 * Fetch the list again without reloading the page.
 *
 * A registration desk sits on this screen for hours, and the only way to see
 * who has signed up since was the browser's reload — which throws away the
 * search, the filter chips, the page you were on and where you had scrolled
 * to, and makes you set all of it up again.
 *
 * `router.refresh()` re-runs the server component and swaps the result into
 * the page it is already showing, so the query and the scroll survive. The
 * URL carries the filters, so what comes back is the same view with newer
 * rows in it.
 *
 * Deliberately a button rather than a timer. A list that reorders itself
 * under a cursor mid-click is how the wrong registration gets opened, and an
 * organizer who is reading a row has not asked for it to move.
 */
export default function RefreshButton({
  /**
   * When the server read the rows, as an ISO string.
   *
   * Passed in rather than noted when the button is clicked, because the
   * question being answered is "how old is what I am looking at", not "when
   * did I last press this". It comes back changed from every refresh on its
   * own, so there is no clock to keep in sync here.
   */
  fetchedAt,
  label = 'تحديث',
}: {
  fetchedAt: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The label ages on its own — "قبل لحظات" that still says so ten minutes
  // later is worse than no label at all, because it reads as "this is
  // current". Nothing is stored; the re-render is the point.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        // The screen reader is told what the spin means; the icon alone says
        // nothing without sight of it.
        aria-label={pending ? 'جارٍ التحديث' : label}
        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13.5px] font-semibold whitespace-nowrap disabled:opacity-70"
        style={{
          background: 'var(--mat-liquid-bg)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--mat-liquid-border)',
        }}
      >
        <RotateCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} />
        {label}
      </button>

      {/* The server rendered this a moment before the browser hydrated it, so
          the two can land either side of a boundary in the wording. */}
      <span
        suppressHydrationWarning
        className="text-[12px] whitespace-nowrap"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {pending ? 'جارٍ التحديث…' : `آخر تحديث ${sinceLabel(fetchedAt)}`}
      </span>
    </div>
  );
}

/** "قبل لحظات" / "قبل 3 دقائق" — rounded down, so it never claims to be newer than it is. */
function sinceLabel(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return 'قبل لحظات';

  const relative = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return relative.format(-minutes, 'minute');
  return relative.format(-Math.floor(minutes / 60), 'hour');
}
