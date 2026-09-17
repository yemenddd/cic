'use client';

import { useTransition } from 'react';
import { CheckCheck, Check } from 'lucide-react';

// Both buttons take an already-bound server action as a prop — the id never
// travels through the client, and the action re-derives the user from the
// session anyway.
export function MarkAllAsReadButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action())}
      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {pending ? '...جارٍ التعليم' : 'تعليم الكل كمقروء'}
    </button>
  );
}

export function MarkAsReadButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action())}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-secondary)' }}
    >
      <Check className="h-3.5 w-3.5" />
      {pending ? '...' : 'تعليم كمقروء'}
    </button>
  );
}
