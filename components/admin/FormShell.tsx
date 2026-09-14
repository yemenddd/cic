'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ label = 'حفظ' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-6 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'rgba(255,255,255,0.92)', color: '#0d0d0f' }}
    >
      {pending ? '...جارٍ الحفظ' : label}
    </button>
  );
}

type ActionResult = { error?: string } | void;

export default function FormShell({
  title,
  backHref,
  action,
  children,
}: {
  title: string;
  backHref: string;
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref} style={{ color: 'var(--text-tertiary)' }}>
          <ArrowRight className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      <form
        action={formAction}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: '#161618', border: '1px solid var(--mat-liquid-border)' }}
      >
        {children}

        {state?.error && (
          <p className="text-[13px]" style={{ color: '#ef4444' }}>{state.error}</p>
        )}

        <div className="pt-2 flex items-center gap-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
