'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScanLine, X } from 'lucide-react';
import QRCode from '@/components/ui/QRCode';

/**
 * The badge, as it is actually used: held up at a door.
 *
 * The page showed the pass at the size it prints at, with an 84px QR on it.
 * That is right for a sheet of paper and wrong for the moment it matters — a
 * phone at arm's length, in a queue, under whatever lighting the venue has,
 * being read by somebody else's camera. This fills the screen with the symbol
 * and nothing else.
 *
 * Three things it does that a plain <img> would not:
 *
 *   - Forces a white field whatever the theme is. A decoder looks for contrast
 *     between dark and light modules, and an attendee who prefers dark mode
 *     should not be the one whose badge takes three tries at the gate.
 *   - Holds a screen wake lock while it is open. A phone that dims halfway
 *     down the queue is the single most predictable annoyance here, and the
 *     lock is released the moment the overlay closes.
 *   - Turns the brightness up as far as a web page can, by covering the
 *     viewport in white — which is most of what a native "boarding pass" mode
 *     does anyway.
 */
export default function GatePass({
  qrValue,
  code,
  name,
}: {
  qrValue: string;
  code: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  // `WakeLockSentinel` is not in this project's DOM lib, and the API is absent
  // on desktop Safari and older Android browsers — hence the loose type and
  // the try/catch. Failing to keep the screen awake must never stop the pass
  // from being shown.
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const release = useCallback(() => {
    void lockRef.current?.release().catch(() => {});
    lockRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    // The page behind must not scroll while a full-screen overlay is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const request = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
        };
        if (nav.wakeLock) lockRef.current = await nav.wakeLock.request('screen');
      } catch {
        // Denied, unsupported, or the tab lost focus. Nothing to do.
      }
    };
    void request();

    // A wake lock is dropped when the tab is hidden and is not restored on its
    // own, so it is taken again when the person comes back to it.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisible);
      document.body.style.overflow = previousOverflow;
      release();
    };
  }, [open, release]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <ScanLine className="h-4 w-4" />
        اعرضها عند البوابة
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="رمز الدخول"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
          style={{
            // Fixed white, not a theme token — see the note above.
            background: '#ffffff',
            // `inset-0` alone left a strip of the page showing along the
            // bottom on a phone: the fixed box resolves against the small
            // viewport while the browser's collapsing chrome makes the visible
            // area taller. `dvh` is the unit for exactly that, with `vh` as
            // the fallback for anything that does not know it.
            height: '100vh',
            minHeight: '100dvh',
          }}
        >
          <p
            className="text-center text-[15px] font-semibold"
            style={{ color: '#16233f' }}
            dir="rtl"
          >
            {name || 'بطاقة المؤتمر'}
          </p>

          {/* Sized against the smaller viewport axis so the symbol is as large
              as it can be in either orientation without being cropped. */}
          <QRCode
            value={qrValue}
            // A real size, not zero: the class below overrides it, but if the
            // stylesheet has not arrived the symbol must still be a symbol
            // rather than a 0×0 box at the moment somebody is at the door.
            size={440}
            margin={2}
            title="رمز الدخول — يُمسح عند البوابة"
            className="h-auto w-[min(78vw,78vh,440px)]"
          />

          {code && code !== '—' && (
            <p
              className="text-center text-[20px] font-bold tracking-[0.18em]"
              style={{ color: '#16233f', fontFamily: 'monospace' }}
              dir="ltr"
            >
              {code}
            </p>
          )}

          <p className="text-center text-[12.5px]" style={{ color: '#44506b' }} dir="rtl">
            اعرض هذا الرمز على موظّف البوابة · اضغط في أي مكان للإغلاق
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
            className="absolute top-5 end-5 rounded-full p-2.5"
            style={{ background: 'rgba(22,35,63,0.08)', color: '#16233f' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
