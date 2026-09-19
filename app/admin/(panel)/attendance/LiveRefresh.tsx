'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';

/**
 * Re-fetches this Server Component page on an interval.
 *
 * The attendance board is watched on a laptop at the organizers' table while
 * other people are scanning at the doors, so a figure that only moves when
 * somebody remembers to press reload is the wrong figure most of the time.
 *
 * `router.refresh()` re-runs the server render and patches the result in — it
 * does not remount the tree, so nothing on the page flashes and no scroll
 * position is lost.
 *
 * It stops while the tab is hidden. A board left open overnight would
 * otherwise keep one database round trip every few seconds until morning.
 */
export default function LiveRefresh({ intervalMs = 15_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [live, intervalMs, router]);

  return (
    <button
      type="button"
      onClick={() => setLive((v) => !v)}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: 'var(--mat-liquid-bg)',
        border: '1px solid var(--mat-liquid-border)',
        color: live ? 'var(--accent-cyan)' : 'var(--text-tertiary)',
      }}
      aria-pressed={live}
    >
      <Radio className={`h-3.5 w-3.5 ${live ? 'animate-pulse' : ''}`} />
      {live ? 'تحديث تلقائي' : 'التحديث متوقف'}
    </button>
  );
}
