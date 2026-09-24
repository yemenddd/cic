import type { Metadata } from 'next';
import Image from 'next/image';
import { CalendarClock } from 'lucide-react';
import RegisterForm from '@/components/sections/RegisterForm';
import { getSiteSettings } from '@/lib/site-settings-server';

/**
 * The invitation link.
 *
 * A registration page to send to people directly, with no way from it into the
 * rest of the site: no header, no footer, no "home" button, no cancel link. It
 * is the same form, the same validation and the same route as /register — only
 * the ways out are missing.
 *
 * Deliberately not indexed. It is meant to arrive in a message from the
 * organizers, and a copy of the registration form competing with /register in
 * search results serves nobody.
 */
export const metadata: Metadata = {
  title: 'التسجيل في مؤتمر الإبداع والابتكار 2026',
  description: 'سجّل في مؤتمر الإبداع والابتكار — النسخة الرابعة، إسطنبول 2026.',
  robots: { index: false, follow: false },
};

// Reads whether registration is open, so closing it from the panel takes
// effect on the next view rather than the next deploy — see /register.
export const dynamic = 'force-dynamic';

export default async function JoinPage() {
  const settings = await getSiteSettings();

  if (!settings.registrationOpen) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center px-4 py-16"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-8 text-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--mat-liquid-border)' }}
        >
          {/* Not a link. Somebody who was sent this and finds registration shut
              should recognise who it came from, not be handed a way in. */}
          <Image
            src="/images/logos/logo.png"
            alt="مؤتمر الإبداع والابتكار"
            width={1285}
            height={367}
            priority
            className="mx-auto mb-6 h-12 w-auto object-contain"
          />

          <span
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--accent-violet) 16%, transparent)' }}
          >
            <CalendarClock className="h-6 w-6" style={{ color: 'var(--accent-violet)' }} strokeWidth={1.6} />
          </span>

          <h1 className="font-outfit text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            التسجيل مغلق
          </h1>
          <p
            className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {settings.registrationClosedNote}
          </p>
        </div>
      </div>
    );
  }

  // The mark lives inside the form, which is the only thing that knows whether
  // it is showing the form or the finished badge — one of those wants a logo
  // above it and the other already carries one.
  return <RegisterForm standalone />;
}
