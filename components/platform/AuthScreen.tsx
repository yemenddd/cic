'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, Sun, Moon, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
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
  footer?: React.ReactNode;
}

export default function AuthScreen({
  heading,
  subheading,
  submitIcon: SubmitIcon,
  submitLabel,
  redirectTo,
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


      {/* Brand panel — a photograph from the conference itself rather than a
          blank surface, with a gradient over it so the type stays legible.
          Fixed light colours here on purpose: the backdrop is a photo, not a
          theme surface, so it must not follow the light/dark tokens. */}
      <aside className="relative hidden lg:block lg:w-[60%] xl:w-2/3 overflow-hidden">
        <Image
          src="/images/experience/2.jpg"
          alt="مشاركون يعرضون مشروعاً في معرض الابتكار خلال المؤتمر"
          fill
          sizes="(min-width: 1280px) 67vw, 60vw"
          priority
          className="object-cover"
        />

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            // Warm and close to even, rather than the cool near-black that was
            // almost transparent at the top and nearly opaque at the bottom.
            // That ramp lit the top of the photograph and buried its bottom;
            // an even veil keeps the whole image readable as one picture and
            // gives the type the same contrast wherever it sits on it.
            background:
              'linear-gradient(to top, rgba(32,26,21,0.88) 0%, rgba(32,26,21,0.74) 45%, rgba(32,26,21,0.64) 100%)',
          }}
        />

        {/* No blend along the edge the panel shares with the form — the two
            meet at a clean vertical line.

            There used to be a gradient in the page colour here, softening the
            join. It was the wrong call twice over: it laid a pale wash across
            the faces at that edge of the photograph, and a soft join between a
            photograph and a form is read as a rendering fault rather than as a
            deliberate transition. A hard edge reads as intentional. Please do
            not put it back. */}

        <div className="relative flex h-full flex-col p-12 xl:p-16">
          {/* The logo's ink follows the theme, but its backdrop here is the
              photo's dark overlay in both themes — left alone it turned navy
              on navy under the light theme. Pinning the variables locally is
              what they are for. */}
          <span
            style={
              {
                '--logo-ink': '#f5f5f7',
                '--logo-ink-soft': '#c8c8ce',
                '--logo-ink-muted': 'rgba(245,245,247,0.6)',
              } as React.CSSProperties
            }
          >
            <CICTLogo height={44} />
          </span>

          {/* `my-auto` rather than `justify-between` on the column: the third
              slot that arrangement balanced against — a "CICT 2026 · النسخة
              الرابعة" line along the bottom — is gone, and with two children
              justify-between would have pinned this to the floor of the panel
              instead of centring it. */}
          <div className="my-auto max-w-2xl">
            {/* One heading, broken over two lines with a deliberate jump in
                size: "منصة" is what this thing *is*, and the conference name
                qualifies it. Set as two spans inside one h2 rather than as a
                heading plus a subheading, because it is one sentence and a
                screen reader should read it as one.

                The display face, not the panel's UI face. The shell sets
                `font-platform`, which forces IBM Plex Sans Arabic across
                everything inside it — right for dense panel chrome, wrong for
                the one element on this screen that is purely brand. Inline, so
                it wins against that rule without another specificity contest. */}
            <h2
              className="font-bold text-white"
              style={{ fontFamily: 'var(--font-thmanyah), serif', lineHeight: 1.12 }}
            >
              <span className="block text-[46px] xl:text-[68px]">منصة</span>
              <span className="mt-2 block text-[26px] xl:text-[36px]">
                مؤتمر الإبداع والابتكار
              </span>
            </h2>

            {/* Reversed out on a white block — the one element on the panel
                that is not the photograph or white type over it, so it is
                where the eye lands last and stays. Square corners: the panel
                already meets the form at a hard edge, and a rounded chip in
                the middle of that would be the only soft shape on the screen.
                inline-block so the block is the width of its words, not of the
                column. */}
            <p
              className="mt-7 inline-block px-4 py-2 text-[15px] xl:text-[18px] font-semibold"
              style={{ background: '#ffffff', color: '#1c1c1e' }}
            >
              نحوّل الأفكار إلى أثر مستدام..
            </p>
          </div>
        </div>
      </aside>

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

              <div className="relative" dir="ltr">
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

            {/* Set apart from the fields above it. With the form's own
                `space-y-4` the action sat exactly as far from the password box
                as the two boxes sat from each other, so it read as a third
                field rather than as the thing the form is for. */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-opacity disabled:opacity-60"
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

    </div>
  );
}
