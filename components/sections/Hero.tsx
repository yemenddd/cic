'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';

const EASE = [0.16, 1, 0.3, 1] as const;
const VP   = { once: true } as const;

const reveal = (delay: number) => ({
  initial:     { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    VP,
  transition:  { duration: 0.62, delay, ease: EASE },
});

const revealWord = (delay: number) => ({
  initial:     { opacity: 0, y: 56 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    VP,
  transition:  { duration: 0.78, delay, ease: EASE },
});

export default function Hero() {
  const { t, dir, lang } = useLang();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-10-02T09:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const countdownItems = [
    { label: t('countdown.days'),    value: timeLeft.days    },
    { label: t('countdown.hours'),   value: timeLeft.hours   },
    { label: t('countdown.minutes'), value: timeLeft.minutes },
    { label: t('countdown.seconds'), value: timeLeft.seconds },
  ];

  const isRtl = dir === 'rtl';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section
      className="relative min-h-screen w-full flex items-center overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Subtle radial gradient — dark mode only */}
      {!isLight && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 55% at 15% -5%, rgba(255,255,255,0.045) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 105%, rgba(255,255,255,0.025) 0%, transparent 55%)',
          }}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col gap-10 pt-16 pb-20 lg:py-28" dir={dir}>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center" dir={dir}>

          {/* ── Text column ── */}
          <div dir={dir} className={`flex flex-col items-start order-2 lg:order-1 ${isRtl ? 'text-right' : 'text-left'}`} style={isRtl ? { paddingRight: '8%' } : {}}>

            <h1 className={`mb-6 flex flex-col gap-0 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
              {lang === 'ar' ? (
                <>
                  <span className="block w-full text-right">
                    <motion.span className="inline-block" {...revealWord(0.1)}>
                      <span
                        dir="rtl"
                        style={{
                          fontFamily:   'var(--font-thmanyah)',
                          fontWeight:   900,
                          fontSize:     'clamp(4rem, 11vw, 7.5rem)',
                          lineHeight:   1.05,
                          display:      'inline-block',
                          paddingTop:   '0.1em',
                          paddingBottom:'0.2em',
                          color:        'var(--text-primary)',
                        }}
                      >
                        من العقل
                      </span>
                    </motion.span>
                  </span>
                  <span className="block w-full text-right">
                    <motion.span className="inline-block" {...revealWord(0.2)}>
                      <span
                        dir="rtl"
                        style={{
                          fontFamily:          'var(--font-thmanyah)',
                          fontWeight:          900,
                          fontSize:            'clamp(4rem, 11vw, 7.5rem)',
                          lineHeight:          1.05,
                          display:             'inline-block',
                          paddingTop:          '0.1em',
                          paddingBottom:       '0.2em',
                          background:          'linear-gradient(to right, #4a98e8, #6c3ecc)',
                          WebkitBackgroundClip:'text',
                          backgroundClip:      'text',
                          WebkitTextFillColor: 'transparent',
                          color:               'transparent',
                        }}
                      >
                        إلى الآلة
                      </span>
                    </motion.span>
                  </span>
                </>
              ) : (
                <>
                  <span className="block w-full text-left">
                    <motion.span className="inline-block" {...revealWord(0.1)}>
                      <span
                        dir="ltr"
                        style={{
                          fontFamily:  'var(--font-outfit)',
                          fontWeight:  900,
                          fontSize:    'clamp(4rem, 10vw, 7rem)',
                          lineHeight:  1.05,
                          display:     'inline-block',
                          color:       'var(--text-primary)',
                        }}
                      >
                        {t('hero.word1')} {t('hero.word2')}
                      </span>
                    </motion.span>
                  </span>
                  <span className="block w-full text-left -mt-2 md:-mt-3">
                    <motion.span className="inline-block" {...revealWord(0.2)}>
                      <span
                        dir="ltr"
                        style={{
                          fontFamily:   'var(--font-outfit)',
                          fontWeight:   900,
                          fontSize:     'clamp(4rem, 10vw, 7rem)',
                          lineHeight:   1.05,
                          display:      'inline-block',
                          paddingTop:   '0.1em',
                          paddingBottom:'0.2em',
                          color:        'var(--text-primary)',
                        }}
                      >
                        {t('hero.word3')}
                      </span>
                    </motion.span>
                  </span>
                </>
              )}
            </h1>

            <motion.p
              className="text-base md:text-[1.0625rem] mb-8 max-w-md leading-relaxed font-bold"
              style={{ color: 'var(--text-secondary)' }}
              {...reveal(0.3)}
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              className={`flex flex-row flex-wrap gap-3 ${isRtl ? 'items-center justify-end' : 'items-center justify-start'}`}
              {...reveal(0.38)}
            >
              <Link
                href="/register"
                className="btn-primary text-center"
                style={{
                  background:           'var(--mat-liquid-bg)',
                  backdropFilter:       'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border:               '1px solid var(--mat-liquid-border)',
                  color:                'var(--text-primary)',
                  boxShadow:            'inset 0 1px 0 var(--mat-liquid-inset), 0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                {t('hero.cta1')}
              </Link>

              <span className="hidden sm:block w-px h-5 shrink-0" style={{ background: 'var(--border-subtle)' }} />

              <Link
                href="/program"
                className="inline-flex items-center gap-2 text-[14px] font-bold transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {t('hero.cta2')}
                <ArrowIcon size={14} className="shrink-0 opacity-60" />
              </Link>
            </motion.div>

          </div>

          {/* ── Video column ── */}
          <motion.div
            className="w-full flex items-center justify-center order-1 lg:order-2"
            initial={{ opacity: 0, x: isRtl ? -52 : 52, scale: 0.94 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={VP}
            transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
          >
            <motion.img
              src={isRtl ? "/images/hero/1-RTL.png" : "/images/hero/1-LTR.png"}
              alt="CIC"
              className="w-[75%] lg:w-full h-auto block mx-auto"
              animate={{ y: [0, -16, 0], rotate: [0, -0.6, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

        </div>

        {/* ── Countdown centered below ── */}
        <motion.div
          className="flex flex-col items-center gap-4"
          {...reveal(0.46)}
        >
          <p className="text-center font-bold text-base" style={{ color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
            {t('hero.countdownLabel')}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            {countdownItems.map((item, i) => (
              <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  className="flex flex-col items-center justify-center"
                  initial={{ opacity: 0, y: 24, scale: 0.82 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={VP}
                  transition={{ duration: 0.48, delay: 0.38 + i * 0.08, ease: EASE }}
                  style={{
                    minWidth:             'clamp(54px, 16vw, 72px)',
                    padding:              'clamp(8px, 2vw, 12px) clamp(6px, 1.5vw, 10px)',
                    background:           'var(--mat-liquid-bg)',
                    backdropFilter:       'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border:               '1px solid var(--mat-liquid-border)',
                    borderRadius:         '14px',
                    boxShadow:            'var(--mat-liquid-shadow)',
                  }}
                >
                  <span
                    className="font-outfit font-bold tabular-nums leading-none"
                    style={{
                      fontSize: 'clamp(1.1rem, 4.5vw, 2.25rem)',
                      color:    'var(--text-primary)',
                    }}
                  >
                    {item.value.toString().padStart(2, '0')}
                  </span>
                  <span className="mt-1 text-caption" style={{ fontSize: 'clamp(8px, 2.2vw, 11px)', letterSpacing: '0.10em', color: 'var(--text-tertiary)' }}>
                    {item.label}
                  </span>
                </motion.div>
                {i < countdownItems.length - 1 && (
                  <span className="text-lg sm:text-2xl font-light -mt-4 sm:-mt-5 select-none" style={{ color: 'var(--text-tertiary)' }}>:</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
