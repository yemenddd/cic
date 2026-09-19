'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';

/**
 * The panels' confirmation dialog.
 *
 * It replaces `window.confirm`, which the panels used for every destructive
 * action. That dialog is drawn by the browser, in the browser's language, in
 * the operating system's own left-to-right chrome — so the last thing an
 * organizer saw before deleting forty attendees was an untranslated grey box
 * that had nothing to do with the Arabic interface around it. It also cannot
 * say which of the two buttons is the dangerous one.
 *
 * Built on the native <dialog> element rather than a div with a backdrop,
 * because `showModal()` brings the parts that are tedious and easy to get
 * wrong: focus is trapped inside, Escape closes, the rest of the page becomes
 * inert to the screen reader, and focus returns to whatever opened it.
 *
 * The API is promise-based so call sites keep the shape they had:
 *
 *     if (!(await confirm({ title: '…' }))) return;
 */

export interface ConfirmOptions {
  title: string;
  /** The consequence, in a sentence. Omitted when the title says it all. */
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` colours the confirm button as destructive. */
  tone?: 'default' | 'danger';
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * Falls back to `window.confirm` when no provider is mounted, rather than
 * throwing. A confirmation that silently never appears is a destructive
 * action that runs unguarded — the ugly dialog is far better than that.
 */
export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  return (
    ctx ??
    (async ({ title, body }: ConfirmOptions) =>
      typeof window === 'undefined' ? false : window.confirm([title, body].filter(Boolean).join('\n\n')))
  );
}

interface Pending extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<Confirm>(
    (options) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  // showModal() has to run after the <dialog> is in the DOM, so it is an
  // effect on the pending request rather than part of `confirm` itself.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pending && !dialog.open) dialog.showModal();
  }, [pending]);

  const settle = useCallback(
    (value: boolean) => {
      dialogRef.current?.close();
      // Read through the setter: a second call (Escape landing at the same
      // moment as a click) would otherwise resolve the same promise twice.
      setPending((current) => {
        current?.resolve(value);
        return null;
      });
    },
    [],
  );

  const danger = pending?.tone === 'danger';
  const accent = danger ? 'var(--destructive)' : 'var(--primary)';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <dialog
        ref={dialogRef}
        dir="rtl"
        // Escape fires `cancel`, not a click — without this the promise would
        // hang forever and the button that opened it would stay disabled.
        onCancel={(e) => {
          e.preventDefault();
          settle(false);
        }}
        // Clicking the backdrop is a click on the <dialog> itself; anything
        // inside it reports one of the children as the target.
        onClick={(e) => {
          if (e.target === dialogRef.current) settle(false);
        }}
        className="platform-dialog"
        aria-labelledby="confirm-dialog-title"
      >
        {pending && (
          <div className="p-6" style={{ maxWidth: '26rem' }}>
            <div className="flex items-start gap-3.5">
              {danger && (
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, var(--destructive) 14%, transparent)' }}
                >
                  <TriangleAlert className="h-4.5 w-4.5" style={{ color: 'var(--destructive)' }} />
                </span>
              )}

              <div className="min-w-0">
                <h2
                  id="confirm-dialog-title"
                  className="font-outfit font-bold text-[15.5px] leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {pending.title}
                </h2>
                {pending.body && (
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {pending.body}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-start gap-2">
              {/* The destructive choice is never the one focus lands on. */}
              <button
                type="button"
                onClick={() => settle(false)}
                autoFocus
                className="rounded-xl px-4 py-2.5 text-[13.5px] font-semibold"
                style={{
                  background: 'var(--mat-liquid-bg)',
                  border: '1px solid var(--mat-liquid-border)',
                  color: 'var(--text-primary)',
                }}
              >
                {pending.cancelLabel ?? 'إلغاء'}
              </button>

              <button
                type="button"
                onClick={() => settle(true)}
                className="rounded-xl px-4 py-2.5 text-[13.5px] font-semibold"
                style={{
                  background: danger ? 'transparent' : accent,
                  border: danger ? `1px solid ${accent}` : '1px solid transparent',
                  color: danger ? accent : 'var(--primary-foreground)',
                }}
              >
                {pending.confirmLabel ?? 'تأكيد'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
