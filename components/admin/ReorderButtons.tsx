'use client';

import { useTransition } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { moveItem, type OrderableModel } from '@/app/admin/reorder-actions';

export default function ReorderButtons({
  model,
  id,
  isFirst,
  isLast,
}: {
  model: OrderableModel;
  id: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  // 22px squares stacked in pairs, on a table row, on a phone: the two are
  // close enough together that a thumb hits whichever it likes. The icon stays
  // the size it was; only what a finger can land on grows.
  const btn = 'flex h-8 w-9 items-center justify-center rounded-md transition-opacity disabled:opacity-25';

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="تحريك لأعلى"
        disabled={pending || isFirst}
        onClick={() => startTransition(() => moveItem(model, id, 'up'))}
        className={btn}
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="تحريك لأسفل"
        disabled={pending || isLast}
        onClick={() => startTransition(() => moveItem(model, id, 'down'))}
        className={btn}
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
