'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';
import { useLang } from '@/lib/i18n';

/**
 * What a visitor sees when a page throws.
 *
 * Without this file Next falls back to its own screen, which is untranslated,
 * left-to-right, and unstyled — on an Arabic site the failure looked worse
 * than it was, and offered no way forward except the browser's back button.
 *
 * Sits inside the root layout, so the language provider is available here.
 * A failure of the layout itself is caught by global-error.tsx instead.
 */

const CONTENT = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    desc: 'تعذّر عرض هذه الصفحة. يمكنك المحاولة مرة أخرى، أو العودة إلى الصفحة الرئيسية.',
    retry: 'حاول مرة أخرى',
    home: 'العودة إلى الرئيسية',
    ref: 'رقم الخطأ',
  },
  en: {
    title: 'Something went wrong',
    desc: 'This page could not be displayed. You can try again, or head back home.',
    retry: 'Try again',
    home: 'Back to home',
    ref: 'Error reference',
  },
  tr: {
    title: 'Beklenmeyen bir hata oluştu',
    desc: 'Bu sayfa görüntülenemedi. Tekrar deneyebilir veya ana sayfaya dönebilirsiniz.',
    retry: 'Tekrar dene',
    home: 'Ana sayfaya dön',
    ref: 'Hata referansı',
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang, dir } = useLang();
  const c = CONTENT[lang as keyof typeof CONTENT] ?? CONTENT.ar;

  useEffect(() => {
    // The full error is already on the server; this puts it in the browser
    // console too, so a report from a visitor has something to quote.
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
      dir={dir === 'rtl' ? 'rtl' : 'ltr'}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(239,68,68,0.07) 0%, transparent 70%)',
        }}
      />

      <div
        className="w-full max-w-md rounded-3xl p-8 text-center"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--mat-liquid-border)',
        }}
      >
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="h-7 w-7" style={{ color: '#ef4444' }} strokeWidth={1.5} />
        </div>

        <h1 className="font-outfit font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>
          {c.title}
        </h1>
        <p className="text-[13.5px] leading-relaxed mb-7" style={{ color: 'var(--text-secondary)' }}>
          {c.desc}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <RotateCcw className="h-4 w-4" />
            {c.retry}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-semibold"
            style={{ background: 'var(--mat-liquid-bg)', color: 'var(--text-primary)' }}
          >
            <Home className="h-4 w-4" />
            {c.home}
          </Link>
        </div>

        {/* Next assigns this to the server-side log entry, so quoting it is
            the only way a visitor can point at their specific failure. */}
        {error.digest && (
          <p className="mt-6 text-[11.5px]" style={{ color: 'var(--text-tertiary)' }} dir="ltr">
            {c.ref}: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
