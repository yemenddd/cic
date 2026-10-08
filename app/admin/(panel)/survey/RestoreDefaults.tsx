'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';

type ActionResult = { error?: string; success?: string } | void;

/**
 * The first question set, for a survey that has none.
 *
 * A button rather than a seed that runs on deploy: an organizer who deliberately
 * emptied the list must not have it refilled behind them, and the action itself
 * refuses to run over an existing set.
 */
export default function RestoreDefaults({ onRestore }: { onRestore: () => Promise<ActionResult> }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>(undefined);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await onRestore()))}
        className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold transition-opacity disabled:opacity-60"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <Sparkles className="h-4 w-4" />
        {pending ? '...' : 'إضافة الأسئلة الافتراضية'}
      </button>

      {result?.error && <p className="mt-3 text-[13px]" style={{ color: 'var(--destructive)' }}>{result.error}</p>}
      {result?.success && <p className="mt-3 text-[13px]" style={{ color: '#22c55e' }}>{result.success}</p>}
    </div>
  );
}
