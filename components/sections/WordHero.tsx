'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── Cycling words per language ────────────────────────────────────────────────
const WORDS = {
  ar: ['ابتكر.', 'أبدع.', 'اكتشف.', 'ابنِ.', 'طوِّر.', 'تعلَّم.', 'تواصل.', 'أثِّر.', 'سجِّل.'],
  en: ['innovate.', 'create.', 'discover.', 'build.', 'develop.', 'learn.', 'connect.', 'impact.', 'register.'],
  tr: ['yenile.', 'yarat.', 'keşfet.', 'inşa et.', 'geliştir.', 'öğren.', 'bağlan.', 'etki et.', 'kaydol.'],
} as const;

const STATIC = { ar: 'يمكنك أن', en: 'you can', tr: 'yapabilirsin' };

const TAGLINE = {
  ar: { a: 'ونحن سنريك كيف.', b: 'انضم إلى مؤتمر الإبداع والابتكار ٢٠٢٦ — وكن جزءاً من حركة التغيير.' },
  en: { a: "and we'll show you how.", b: 'Join the Creativity & Innovation Conference 2026 — be part of the movement.' },
  tr: { a: 've biz size nasıl yapacağınızı göstereceğiz.', b: 'CICT 2026\'ya katılın — değişimin bir parçası olun.' },
};

const CTA = { ar: 'سجّل مقعدك الآن', en: 'Register Your Seat', tr: 'Yerinizi Kaydedin' };
const SUB = { ar: 'المقاعد محدودة · مجاني', en: 'Limited seats · Free', tr: 'Sınırlı kontenjan · Ücretsiz' };

export default function WordHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';
  const l = lang as keyof typeof WORDS;
  const words = WORDS[l] ?? WORDS.ar;
  const count = words.length;

  return (
    <div
      className="cict-wh"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ ['--count' as string]: count } as React.CSSProperties}
    >
      {/* ── Sticky cycling header ────────────────────────────────── */}
      <header className="cict-wh-header">
        <div className="cict-wh-header-inner">
          <h1 className="cict-wh-static" aria-hidden="true">
            {STATIC[l]}&nbsp;
          </h1>
          <ul className="cict-wh-list" aria-hidden="true">
            {words.map((word, i) => (
              <li key={i} style={{ ['--i' as string]: i } as React.CSSProperties}>
                {word}
              </li>
            ))}
          </ul>
          <span className="sr-only">{STATIC[l]} {words[words.length - 1]}</span>
        </div>
      </header>

      {/* ── CTA main panel ───────────────────────────────────────── */}
      <main className="cict-wh-main">
        <section className="cict-wh-main-inner">
          <div className="cict-wh-cta-content">
            {/* Conference mark */}
            <span className="cict-wh-eyebrow">CICT 2026 · إسطنبول · أغسطس ١٥-١٦</span>

            {/* Tagline */}
            <p className="cict-wh-tagline-a">{TAGLINE[l].a}</p>
            <p className="cict-wh-tagline-b">{TAGLINE[l].b}</p>

            {/* Register button */}
            <div className="cict-wh-actions">
              <Link
                href="/register"
                className="cict-wh-btn-primary"
              >
                {CTA[l]}
                <ArrowRight
                  className="cict-wh-btn-icon"
                  style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }}
                />
              </Link>
              <p className="cict-wh-sub">{SUB[l]}</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Scoped styles ────────────────────────────────────────── */}
      <style>{`
        .cict-wh {
          --start: 50vh;
          --space: 40vh;
          background: #030712;
          width: 100%;
          overflow: hidden;
        }

        /* ── Sticky header ── */
        .cict-wh-header {
          position: sticky;
          top: calc((var(--count) - 1) * -1lh);
          line-height: 1.25;
          font-size: clamp(2.4rem, 5.5vw, 5rem);
          font-weight: 800;
          width: 100%;
          margin-bottom: var(--space);
          background: #030712;
          z-index: 1;
        }

        .cict-wh-header-inner {
          display: flex;
          width: 100%;
          align-items: flex-start;
          justify-content: center;
          padding-top: calc(var(--start) - 0.55lh);
          padding-bottom: 0;
        }

        .cict-wh-static {
          position: sticky;
          top: calc(var(--start) - 0.55lh);
          margin: 0;
          color: rgba(255,255,255,0.25);
          white-space: nowrap;
        }

        .cict-wh-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cict-wh-list li {
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.15) 0 calc(var(--start) - 0.55lh),
            #06b6d4                  calc(var(--start) - 0.55lh) calc(var(--start)),
            #a78bfa                  calc(var(--start))           calc(var(--start) + 0.55lh),
            rgba(255,255,255,0.15) calc(var(--start) + 0.55lh)
          );
          background-attachment: fixed;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          line-height: inherit;
        }

        /* ── Main CTA panel ── */
        .cict-wh-main {
          width: 100%;
          min-height: 100vh;
          position: relative;
          z-index: 2;
        }

        .cict-wh-main::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: #030712;
          border-radius: 1.5rem 1.5rem 0 0;
        }

        .cict-wh-main-inner {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5rem 1.5rem;
        }

        .cict-wh-cta-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 680px;
          gap: 0;
        }

        .cict-wh-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(6,182,212,0.8);
          margin-bottom: 1.5rem;
          font-family: monospace;
        }

        .cict-wh-tagline-a {
          margin: 0 0 0.5rem;
          font-weight: 800;
          font-size: clamp(1.8rem, 4vw, 3.2rem);
          line-height: 1.1;
          color: #ffffff;
        }

        .cict-wh-tagline-b {
          margin: 0 0 2.5rem;
          font-weight: 400;
          font-size: clamp(0.9rem, 1.5vw, 1.15rem);
          line-height: 1.7;
          color: rgba(255,255,255,0.45);
          max-width: 520px;
        }

        .cict-wh-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .cict-wh-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 2.25rem;
          border-radius: 9999px;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          text-decoration: none;
          background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);
          box-shadow: 0 0 48px rgba(139,92,246,0.35);
          transition: opacity 0.2s, transform 0.15s;
        }
        .cict-wh-btn-primary:hover { opacity: 0.88; }
        .cict-wh-btn-primary:active { transform: scale(0.97); }

        .cict-wh-btn-icon {
          width: 1.1rem;
          height: 1.1rem;
          flex-shrink: 0;
        }

        .cict-wh-sub {
          margin: 0;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.05em;
        }

        /* ── Scroll-driven entrance animation ── */
        @supports (animation-timeline: view()) {
          .cict-wh-main { view-timeline: --cict-wh-panel; }
          .cict-wh-main::before {
            transform-origin: 50% 100%;
            scale: 0.92;
            animation: cict-wh-grow both ease-in-out;
            animation-timeline: --cict-wh-panel;
            animation-range: entry 40%;
          }
          .cict-wh-main-inner {
            animation: cict-wh-fade both ease-in-out;
            animation-timeline: --cict-wh-panel;
            animation-range: entry 40%;
          }
          @keyframes cict-wh-fade  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes cict-wh-grow  { to   { scale: 1; border-radius: 0; } }
        }
      `}</style>
    </div>
  );
}
