'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, Sun, Moon, Eye, EyeOff, TriangleAlert, CalendarClock, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CICTLogo from '@/components/ui/CICTLogo';
import { useTheme } from '@/lib/theme-context';
import { loginErrorMessage } from '@/lib/login-error';

/**
 * The sign-in screen, shared by the organisers' panel and the attendee
 * dashboard.
 *
 * The two were near-identical copies differing in a title, an icon and a
 * redirect — and both carried the same defects, so each one had to be fixed
 * twice. What differs between them is passed in.
 */

export interface AuthScreenProps {
  heading: string;
  subheading: string;
  submitIcon: LucideIcon;
  submitLabel: string;
  /** Where to go once the credentials are accepted. */
  redirectTo: string;
  /** Conference context for the side panel, computed on the server so the
   *  countdown cannot differ between the server render and hydration. */
  conference: { countdown: string; range: string; venue: string };
  footer?: React.ReactNode;
}

export default function AuthScreen({
  heading,
  subheading,
  submitIcon: SubmitIcon,
  submitLabel,
  redirectTo,
  conference,
  footer,
}: AuthScreenProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Generated ids, so the labels below are actually tied to their inputs.
  // Without htmlFor/id a screen reader announces an unlabelled text box and
  // clicking the label does nothing — both were true of the old forms.
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      // `code` carries the reason — repeated failures are a wait, not a typo.
      setErrorMsg(loginErrorMessage(res.code));
      setStatus('error');
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div
      className="font-platform flex min-h-screen"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        className="fixed top-5 end-5 z-10 rounded-xl p-2.5"
        style={{
          background: 'var(--mat-liquid-bg)',
          border: '1px solid var(--mat-liquid-border)',
          color: 'var(--text-secondary)',
        }}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>


      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center lg:items-start">
            <span className="lg:hidden">
              <CICTLogo height={40} />
            </span>
            <h1
              className="mt-5 font-outfit font-bold text-[22px] lg:mt-0"
              style={{ color: 'var(--text-primary)' }}
            >
              {heading}
            </h1>
            <p
              className="mt-1.5 text-center text-[13px] lg:text-start"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {subheading}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor={emailId}
                className="mb-2 block text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                البريد الإلكتروني
              </label>
              <input
                id={emailId}
                name="email"
                required
                autoFocus
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="mb-2 block text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                كلمة المرور
              </label>

              <div className="relative">
                <input
                  id={passwordId}
                  name="password"
                  required
                  type={reveal ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Caps Lock is the reason a correct password is typed wrong,
                  // and it is invisible behind the dots.
                  onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  onBlur={() => setCapsLock(false)}
                  className="input-glass pe-11"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-pressed={reveal}
                  className="absolute inset-y-0 end-0 flex items-center px-3.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {capsLock && (
                <p className="mt-2 flex items-center gap-1.5 text-[11.5px]" style={{ color: '#f59e0b' }}>
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                  مفتاح Caps Lock مُفعَّل
                </p>
              )}
            </div>

            {status === 'error' && (
              // role=alert so the message is announced, not only shown.
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--destructive) 28%, transparent)',
                  color: 'var(--destructive)',
                }}
              >
                <TriangleAlert className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SubmitIcon className="h-4 w-4" />
              )}
              {status === 'loading' ? 'جارٍ الدخول…' : submitLabel}
            </button>
          </form>

          {footer && <div className="mt-6 text-center text-[13px]">{footer}</div>}
        </div>
      </main>

      {/* Brand panel — real context (when and where), not decoration. Hidden on
          small screens, where the form is the only thing worth the space. */}
      <aside
        className="hidden lg:flex w-[46%] max-w-xl flex-col justify-between p-12"
        style={{
          background: 'var(--bg-elevated)',
          borderInlineStart: '1px solid var(--mat-liquid-border)',
        }}
      >
        <CICTLogo height={44} />

        <div>
          <h2
            className="font-outfit font-bold text-[26px] leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            منصة مؤتمر الإبداع والابتكار
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            مساحة واحدة للتسجيل والبرنامج والبطاقات والابتكارات المقدَّمة.
          </p>

          <div className="mt-8 space-y-2.5">
            <p className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <CalendarClock className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-violet)' }} />
              {conference.range}
              <span style={{ color: 'var(--text-tertiary)' }}>· {conference.countdown}</span>
            </p>
            <p className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-violet)' }} />
              {conference.venue}
            </p>
          </div>
        </div>

        <p className="text-[11.5px]" style={{ color: 'var(--text-tertiary)' }}>
          CICT 2026 · النسخة الرابعة
        </p>
      </aside>
    </div>
  );
}
