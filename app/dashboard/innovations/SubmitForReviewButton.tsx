'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { useConfirm } from '@/components/platform/ConfirmDialog';
import { submitForReview } from './actions';

export default function SubmitForReviewButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (
            !(await confirm({
              title: 'إرسال المشروع إلى لجنة المراجعة؟',
              body: 'لن تتمكن من تعديله بعد الإرسال.',
              confirmLabel: 'إرسال',
            }))
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await submitForReview(id);
            if (result?.error) setError(result.error);
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-opacity disabled:opacity-60"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <Send className="h-3.5 w-3.5" />
        {pending ? '...جارٍ الإرسال' : 'إرسال للمراجعة'}
      </button>
      {error && (
        <p className="text-[11.5px]" style={{ color: 'var(--destructive)' }}>{error}</p>
      )}
    </div>
  );
}
