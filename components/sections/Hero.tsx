'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';

const EASE = [0.16, 1, 0.3, 1] as const;

const fade = (delay: number) => ({
  initial:    { opacity: 0, y: 22 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE },
});

const fadeWord = (delay: number) => ({
  initial:    { opacity: 0, y: 36 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: EASE },
});

export default function Hero() {
  const { t, dir, lang } = useLang();
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-08-15T09:00:00').getTime();
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
      className="relative min-h-screen w-full flex items-center"
      style={{ background: 'var(--hero-bg)' }}
    >
      {/* Subtle gray gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.055) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-24 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col gap-10 py-28" dir="ltr">

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Text column ── */}
          <div className={`flex flex-col ${isRtl ? 'items-end text-right' : 'items-start text-left'}`}>

            <h1 className={`mb-6 flex flex-col gap-0 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
              {lang === 'ar' ? (
                <>
                  <span className="block w-full text-right -mb-10 md:-mb-20">
                    <motion.span className="inline-block" {...fadeWord(0.1)}>
                      <img
                        src="/images/logos/من_العقل.svg"
                        alt="من العقل"
                        className="object-right translate-x-[4%] md:translate-x-[6%] w-[280px] sm:w-[400px] md:w-[500px] max-w-full h-auto"
                        style={{ filter: theme === 'light' ? 'brightness(0)' : 'brightness(0) invert(1)' }}
                      />
                    </motion.span>
                  </span>
                  <span className="block w-full text-right">
                    <motion.span className="inline-block" {...fadeWord(0.2)}>
                      <span
                        dir="rtl"
                        style={{
                          fontFamily:           'var(--font-thmanyah)',
                          fontWeight:           900,
                          fontSize:             'clamp(4rem, 11vw, 7.5rem)',
                          lineHeight:           1.05,
                          display:              'inline-block',
                          paddingTop:           '0.1em',
                          paddingBottom:        '0.2em',
                          background:           'var(--gradient-text)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor:  'transparent',
                          backgroundClip:       'text',
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
                    <motion.span className="inline-block" {...fadeWord(0.1)}>
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
                    <motion.span className="inline-block" {...fadeWord(0.2)}>
                      <span
                        dir="ltr"
                        style={{
                          fontFamily:           'var(--font-outfit)',
                          fontWeight:           900,
                          fontSize:             'clamp(4rem, 10vw, 7rem)',
                          lineHeight:           1.05,
                          display:              'inline-block',
                          paddingTop:           '0.1em',
                          paddingBottom:        '0.2em',
                          background:           'var(--gradient-text)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor:  'transparent',
                          backgroundClip:       'text',
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
              className="text-base md:text-[1.0625rem] mb-8 max-w-md leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
              {...fade(0.3)}
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
              {...fade(0.38)}
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
                className="inline-flex items-center gap-2 text-[14px] font-medium transition-colors duration-200"
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
            className="w-full flex items-center justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
          >
            <motion.img
              src="/images/hero/1.png"
              alt="CICT 2026"
              className="w-full h-auto block"
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

        </div>

        {/* ── Countdown centered below ── */}
        <motion.div
          className="flex flex-col items-center gap-4"
          {...fade(0.46)}
        >
          <p className="text-caption text-center" style={{ color: 'var(--text-secondary)', letterSpacing: '0.14em' }}>
            {t('hero.countdownLabel')}
          </p>
          <div className="flex items-center gap-3">
            {countdownItems.map((item, i) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    minWidth:             '72px',
                    padding:              '12px 10px',
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
                      fontSize:             'clamp(1.6rem, 3vw, 2.25rem)',
                      background:           'var(--metallic-grad)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor:  'transparent',
                      backgroundClip:       'text',
                    }}
                  >
                    {item.value.toString().padStart(2, '0')}
                  </span>
                  <span className="mt-1.5 text-caption" style={{ letterSpacing: '0.12em', color: 'var(--text-tertiary)' }}>
                    {item.label}
                  </span>
                </div>
                {i < countdownItems.length - 1 && (
                  <span className="text-2xl font-light -mt-5 select-none" style={{ color: 'var(--text-tertiary)' }}>:
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
