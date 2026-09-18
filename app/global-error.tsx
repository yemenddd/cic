'use client';

/**
 * The last resort: this replaces the root layout itself, so it runs when the
 * layout — providers, fonts, theme — is what failed.
 *
 * Everything here is deliberately self-contained. No provider, no stylesheet,
 * no icon component, no design token: any of those could be the thing that is
 * broken. Arabic only, because the language provider is exactly what is
 * missing at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#030712',
          color: '#e5e7eb',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '26rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem' }}>
            تعذّر تحميل الموقع
          </h1>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.8, color: '#9ca3af', margin: '0 0 1.75rem' }}>
            حدث خطأ غير متوقع أثناء تحميل الصفحة. حاول مرة أخرى، وإذا تكرر الأمر
            فتواصل مع فريق المؤتمر.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.7rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            حاول مرة أخرى
          </button>

          {error.digest && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#6b7280' }} dir="ltr">
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
