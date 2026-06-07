'use client';

import Link from 'next/link';
import { useLang } from '@/lib/i18n';

// ── Cycling words per language ───────────────────────────────────────────────
const WORDS = {
  ar: ['إبداع.', 'ابتكار.', 'روبوتات.', 'أبحاث.', 'تقنية.', 'ريادة.'],
  en: ['Creativity.', 'Innovation.', 'Robotics.', 'Research.', 'Technology.', 'Leadership.'],
  tr: ['Yaratıcılık.', 'İnovasyon.', 'Robotik.', 'Araştırma.', 'Teknoloji.', 'Liderlik.'],
};

// ── CTA copy per language ────────────────────────────────────────────────────
const COPY = {
  ar: {
    taglineA: 'يوم التقاء العقل اليمني',
    taglineB: 'بأدوات مستقبله.',
    sub:      'كن جزءاً من مؤتمر الإبداع والابتكار — النسخة الرابعة. مكان واحد لكل من يؤمن بأن اليمن يستحق أكثر.',
    primary:  'احجز مقعدك الآن',
    secondary:'استعرض البرنامج',
    meta:     '15-16 أغسطس 2026  ·  إسطنبول، تركيا',
  },
  en: {
    taglineA: 'Where Yemeni minds',
    taglineB: 'meet the tools of the future.',
    sub:      'Join the 4th Creativity & Innovation Conference — two days for everyone who believes Yemen deserves more.',
    primary:  'Reserve Your Seat',
    secondary:'View the Program',
    meta:     'Aug 15–16, 2026  ·  Istanbul, Turkey',
  },
  tr: {
    taglineA: "Yemenli zihinlerin",
    taglineB: 'geleceğin araçlarıyla buluştuğu yer.',
    sub:      '4. Yaratıcılık ve İnovasyon Konferansı — Yemen\'in daha fazlasını hak ettiğine inanan herkes için iki gün.',
    primary:  'Yerini Ayırt Şimdi',
    secondary:'Programı İncele',
    meta:     '15-16 Ağustos 2026  ·  İstanbul, Türkiye',
  },
};

export default function WordHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';
  const words = WORDS[lang as keyof typeof WORDS] ?? WORDS.ar;
  const c     = COPY[lang as keyof typeof COPY]   ?? COPY.ar;
  const count = words.length;

  return (
    <div
      className="wh-root"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ '--count': count } as React.CSSProperties}
    >
      {/* ── Sticky cycling words ──────────────────────────────────── */}
      <header className="wh-header">
        <section className="wh-words-wrap">
          <ul className="wh-ul" aria-label={words.join(', ')}>
            {words.map((word, i) => (
              <li
                key={i}
                className="wh-li"
                style={{ '--i': i } as React.CSSProperties}
              >
                {word}
              </li>
            ))}
          </ul>
        </section>
      </header>

      {/* ── Registration CTA ─────────────────────────────────────── */}
      <main className="wh-main">
        <section className="wh-cta">
          <div className="wh-inner" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Eyebrow */}
            <div className="wh-eyebrow">
              <span className="wh-dot" />
              CICT 2026
              <span className="wh-dot" />
            </div>

            {/* Headline */}
            <h2 className="wh-headline">
              <span className="wh-line-a">{c.taglineA}</span>
              <span className="wh-line-b">{c.taglineB}</span>
            </h2>

            {/* Sub-text */}
            <p className="wh-sub">{c.sub}</p>

            {/* Buttons */}
            <div className="wh-btns">
              <Link href="/register" className="wh-btn-primary">
                {c.primary}
              </Link>
              <Link href="/program" className="wh-btn-secondary">
                {c.secondary}
              </Link>
            </div>

            {/* Meta */}
            <p className="wh-meta">{c.meta}</p>
          </div>
        </section>
      </main>

      {/* ── Scoped styles ────────────────────────────────────────── */}
      <style>{`
        .wh-root {
          --start: 50vh;
          --space: 50vh;
          background: #030712;
        }

        /* ── Sticky header ── */
        .wh-header {
          position: sticky;
          top: calc((var(--count) - 1) * -1lh);
          line-height: 1.15;
          display: flex;
          align-items: flex-start;
          width: 100%;
          margin-bottom: var(--space);
        }

        .wh-words-wrap {
          display: flex;
          width: 100%;
          align-items: flex-start;
          justify-content: center;
          padding-top: calc(var(--start) - 0.5lh);
        }

        /* ── Cycling word list ── */
        .wh-ul {
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: clamp(2.8rem, 9vw, 8rem);
          font-weight: 900;
          text-align: center;
          letter-spacing: -0.02em;
        }

        .wh-li {
          /* Gradient band: dimmed above/below, accent at --start */
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.1)  0 calc(var(--start) - 0.5lh),
            #06b6d4                calc(var(--start) - 0.55lh) calc(var(--start) + 0.08lh),
            #a78bfa                calc(var(--start) + 0.08lh) calc(var(--start) + 0.55lh),
            rgba(255,255,255,0.1)  calc(var(--start) + 0.5lh)
          );
          background-attachment: fixed;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ── CTA main section ── */
        .wh-main {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 100vh;
        }

        .wh-main::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: #030712;
          border-radius: 2rem 2rem 0 0;
        }

        .wh-cta {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 1.5rem;
        }

        .wh-inner {
          max-width: 760px;
          width: 100%;
          text-align: center;
        }

        .wh-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 1.5rem;
        }
        .wh-dot {
          display: inline-block;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .wh-headline {
          margin: 0 0 1.5rem;
          font-weight: 900;
          line-height: 1.1;
        }
        .wh-line-a {
          display: block;
          font-size: clamp(1.8rem, 4.5vw, 3.8rem);
          color: rgba(255,255,255,0.9);
        }
        .wh-line-b {
          display: block;
          font-size: clamp(1.8rem, 4.5vw, 3.8rem);
          background: linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .wh-sub {
          margin: 0 0 2.5rem;
          font-size: clamp(0.95rem, 1.8vw, 1.15rem);
          line-height: 1.75;
          color: rgba(255,255,255,0.45);
          max-width: 580px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 2.5rem;
        }

        .wh-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .wh-btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.9rem 2.4rem;
          border-radius: 9999px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);
          text-decoration: none;
          box-shadow: 0 0 40px rgba(139,92,246,0.4);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .wh-btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }

        .wh-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 0.9rem 2.4rem;
          border-radius: 9999px;
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          text-decoration: none;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .wh-btn-secondary:hover {
          border-color: rgba(255,255,255,0.22);
          color: #fff;
        }

        .wh-meta {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
        }

        /* ── View-timeline reveal animation ── */
        @supports (animation-timeline: view()) {
          .wh-main { view-timeline: --wh-main; }

          .wh-main::before {
            transform-origin: 50% 100%;
            scale: 0.9;
            animation: wh-grow both ease-in-out;
            animation-timeline: --wh-main;
            animation-range: entry 50%;
          }

          .wh-cta {
            position: fixed;
            top: 50%; left: 50%;
            translate: -50% -50%;
            opacity: 0;
            pointer-events: none;
            animation: wh-fade both ease-in-out;
            animation-timeline: --wh-main;
            animation-range: entry 50%;
          }
          .wh-cta.wh-active { pointer-events: auto; }

          @keyframes wh-grow { to { scale: 1; border-radius: 0; } }
          @keyframes wh-fade { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
