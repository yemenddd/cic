'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

type ActionResult = { error?: string; success?: string } | void;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-6 py-2.5 text-[14px] font-semibold transition-opacity disabled:opacity-60"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {pending ? '...جارٍ الحفظ' : label}
    </button>
  );
}

// Same card + submit-row anatomy as components/admin/FormShell.tsx, minus the
// back link — the account page stacks two of these, and two back arrows on one
// page would be noise. `action` matches FormShell's useActionState signature.
export default function AccountForm({
  title,
  description,
  action,
  submitLabel = 'حفظ',
  children,
}: {
  title: string;
  description?: string;
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
    >
      <div>
        <h2 className="font-outfit font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
        )}
      </div>

      {children}

      {state?.error && <p className="text-[13px]" style={{ color: '#ef4444' }}>{state.error}</p>}
      {state?.success && <p className="text-[13px]" style={{ color: '#22c55e' }}>{state.success}</p>}

      <div className="pt-2 flex items-center gap-3" style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
