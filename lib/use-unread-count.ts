'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The unread notification count, kept current without a page reload.
 *
 * The badge used to be counted once, in the dashboard layout, and then sat
 * there until the next navigation. An announcement reaches everybody at the
 * same moment — a room change, a session moved — and somebody sitting on their
 * own agenda page would not learn about it until they happened to click
 * something else.
 *
 * Polled rather than pushed. A socket for a number that changes a handful of
 * times over two days would be a connection per attendee held open all day,
 * on a platform whose functions are billed by the second.
 *
 * Three things keep the polling honest:
 *
 *   - It stops while the tab is hidden, and asks immediately when it comes
 *     back. A dashboard left open in a background tab overnight would
 *     otherwise be a request a minute until morning, from every attendee.
 *   - The interval backs off while nothing is changing, and resets the moment
 *     something does.
 *   - `initial` comes from the server render, so the badge is right on first
 *     paint and the first poll only ever confirms it.
 */

/** Asked this often when something recently changed. */
const MIN_INTERVAL_MS = 20_000;
/** And no more often than this once the feed has been quiet for a while. */
const MAX_INTERVAL_MS = 120_000;

export function useUnreadCount(initial: number): number {
  const [count, setCount] = useState(initial);

  // Held in refs so changing them never restarts the effect — the timer owns
  // its own schedule, and re-running this on every tick would be the bug it
  // is meant to avoid.
  const intervalRef = useRef(MIN_INTERVAL_MS);
  const countRef = useRef(initial);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        const next = typeof (data as { count?: unknown })?.count === 'number'
          ? (data as { count: number }).count
          : null;
        if (next === null || cancelled) return;

        if (next !== countRef.current) {
          countRef.current = next;
          setCount(next);
          // Something moved — start asking often again.
          intervalRef.current = MIN_INTERVAL_MS;
        } else {
          intervalRef.current = Math.min(MAX_INTERVAL_MS, intervalRef.current * 1.5);
        }
      } catch {
        // Offline, or the session ended. The badge keeps its last known value
        // rather than dropping to zero, which would read as "all caught up".
        intervalRef.current = Math.min(MAX_INTERVAL_MS, intervalRef.current * 2);
      }
    };

    const schedule = () => {
      timer = setTimeout(async () => {
        await poll();
        if (!cancelled) schedule();
      }, intervalRef.current);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // Coming back to the tab is exactly when the count is most likely to
        // be stale, so it is asked for at once rather than on the next tick.
        intervalRef.current = MIN_INTERVAL_MS;
        void poll();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return count;
}
