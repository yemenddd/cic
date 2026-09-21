import Link from 'next/link';
import CICLogo from '@/components/ui/CICLogo';

/**
 * The frame around the short auth screens — asking for a reset link, and
 * choosing a new password.
 *
 * Deliberately not AuthScreen: that one is the sign-in screen, built around a
 * credentials form, a photograph and the conference countdown. These two are a
 * single field and a sentence, and bending the larger component to render them
 * would tie a rarely-used page to every future change of the sign-in design.
 *
 * A Server Component — nothing here is interactive; the forms inside are.
 */
export default function AuthCard({
  heading,
  subheading,
  children,
  footer,
}: {
  heading: string;
  subheading: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="font-platform flex min-h-screen items-center justify-center p-5"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      <main className="w-full" style={{ maxWidth: '25rem' }}>
        <Link href="/" className="mb-8 flex justify-center" aria-label="الصفحة الرئيسية">
          <CICLogo variant="mark" height={44} />
        </Link>

        <div
          className="rounded-2xl p-7"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <h1 className="font-outfit font-bold text-[20px]" style={{ color: 'var(--text-primary)' }}>
            {heading}
          </h1>
          <p className="mt-2 mb-6 text-[13px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {subheading}
          </p>

          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            {footer}
          </p>
        )}
      </main>
    </div>
  );
}
