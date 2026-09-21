'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { passwordStrength, STRENGTH_COLORS, type PasswordStrength } from '@/lib/password-strength';

/**
 * Live feedback on the new password, and whether the confirmation matches.
 *
 * Reads the enclosing form the same way ProfileStrength does, for the same
 * reason — the inputs are the shared uncontrolled fields and this page should
 * not force a controlled variant of them into existence.
 *
 * The mismatch line matters more than it looks: the two password fields are
 * checked on the server, and getting it wrong there costs a round trip and
 * clears both boxes. Saying so while the second one is still being typed is
 * the whole difference.
 */
export default function PasswordMeter({ email }: { email: string | null }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [confirm, setConfirm] = useState<'empty' | 'match' | 'differ'>('empty');

  useEffect(() => {
    const form = hostRef.current?.closest('form');
    if (!form) return;

    const read = () => {
      const data = new FormData(form);
      const next = String(data.get('next') ?? '');
      const conf = String(data.get('confirm') ?? '');
      setStrength(next.length > 0 ? passwordStrength(next, email) : null);
      setConfirm(conf.length === 0 ? 'empty' : conf === next ? 'match' : 'differ');
    };

    form.addEventListener('input', read);
    read();
    return () => form.removeEventListener('input', read);
  }, [email]);

  // Nothing typed yet — no empty meter sitting there telling the person their
  // blank password is weak.
  if (!strength && confirm === 'empty') return <div ref={hostRef} />;

  return (
    <div ref={hostRef} className="space-y-2.5" aria-live="polite">
      {strength && (
        <>
          <div className="flex items-center gap-3">
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ background: 'var(--mat-liquid-bg)' }}
              role="progressbar"
              aria-valuenow={Math.round(strength.ratio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`قوة كلمة المرور: ${strength.label}`}
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${strength.ratio * 100}%`,
                  background: STRENGTH_COLORS[strength.level],
                  transition: 'width 250ms ease, background 250ms ease',
                }}
              />
            </span>
            <span
              className="shrink-0 text-[12px] font-semibold"
              style={{ color: STRENGTH_COLORS[strength.level] }}
            >
              {strength.label}
            </span>
          </div>

          {strength.advice && (
            <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {strength.advice}
            </p>
          )}
        </>
      )}

      {confirm !== 'empty' && (
        <p
          className="flex items-center gap-1.5 text-[11.5px] font-semibold"
          style={{
            color: confirm === 'match' ? 'var(--accent-cyan)' : 'var(--destructive)',
          }}
        >
          {confirm === 'match' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {confirm === 'match' ? 'الكلمتان متطابقتان' : 'الكلمتان غير متطابقتين'}
        </p>
      )}
    </div>
  );
}
