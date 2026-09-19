'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';

export default function DeleteButton({ action, confirmText = 'حذف هذا العنصر نهائياً؟' }: {
  action: () => Promise<void>;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!(await confirm({ title: confirmText, confirmLabel: 'حذف', tone: 'danger' }))) return;
        startTransition(() => action());
      }}
      className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
      style={{ color: '#ef4444' }}
      aria-label="حذف"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
