'use client';

import { useTransition } from 'react';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { saveSession, unsaveSession } from '@/app/dashboard/agenda/actions';

export default function SaveSessionButton({
  sessionId,
  saved,
}: {
  sessionId: string;
  saved: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const Icon = pending ? Loader2 : saved ? BookmarkCheck : BookmarkPlus;

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        startTransition(() => (saved ? unsaveSession(sessionId) : saveSession(sessionId)))
      }
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
      style={
        saved
          ? {
              background: 'var(--mat-liquid-bg)',
              border: '1px solid var(--mat-liquid-border)',
              color: 'var(--text-secondary)',
            }
          : {
              background: 'var(--primary)',
              border: '1px solid var(--primary)',
              color: 'var(--primary-foreground)',
            }
      }
    >
      <Icon className={`h-3.5 w-3.5${pending ? ' animate-spin' : ''}`} />
      {saved ? 'إزالة' : 'إضافة'}
    </button>
  );
}
