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

  const btn = 'p-1 rounded-md transition-opacity disabled:opacity-25';

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
