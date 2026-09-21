import Link from 'next/link';
import { CalendarClock, ArrowLeft } from 'lucide-react';
import RegisterForm from '@/components/sections/RegisterForm';
import { pageMetadata } from '@/lib/page-metadata';
import { getSiteSettings } from '@/lib/site-settings-server';

export const metadata = pageMetadata({
  title: 'التسجيل | مؤتمر الإبداع والابتكار 2026',
  description: 'سجّل الآن في مؤتمر الإبداع والابتكار — النسخة الرابعة، إسطنبول 2026.',
});

/**
 * Rendered per request, not prerendered.
 *
 * This page reads whether registration is open, and as a static page it was
 * baked at build time: closing registration from the panel left the form on
 * screen until the next deploy. The save action does revalidate this path, but
 * a gate that depends on a cache invalidation firing correctly is a gate that
 * is open whenever that invalidation does not.
 *
 * The cost is one settings lookup per view of one low-traffic page, against
 * being certain that what is shown is what the route will accept.
 */
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const settings = await getSiteSettings();

  // Closed from the panel. The route refuses the post as well — this is the
  // half that stops somebody filling in a long form only to be told at the end
  // that it was never going to be accepted.
  if (!settings.registrationOpen) {
    return (
      <div dir="rtl" className="mx-auto w-full max-w-xl px-4 py-24 sm:px-6">
        <div
          className="rounded-2xl p-7 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          <span
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' }}
          >
            <CalendarClock
              className="h-6 w-6"
              style={{ color: 'var(--accent-violet)' }}
              strokeWidth={1.6}
            />
          </span>

          <h1 className="font-outfit font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            التسجيل مغلق
          </h1>

          <p
            className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {settings.registrationClosedNote}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              العودة للموقع
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {/* Somebody who already registered still has an account, and
                closing new registrations must not read as "the site is shut". */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
              style={{
                background: 'var(--mat-liquid-bg)',
                border: '1px solid var(--mat-liquid-border)',
                color: 'var(--text-primary)',
              }}
            >
              لديّ حساب — تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <RegisterForm />;
}
