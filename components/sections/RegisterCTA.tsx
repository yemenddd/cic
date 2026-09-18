'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CtaCard } from '@/components/ui/cta-card';
import { useLang } from '@/lib/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.5, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.6, delay, ease: EASE },
});

function CountCard({ value, label }: { value: number; label: string }) {
  const str = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className="relative overflow-hidden flex items-center justify-center glass-surface"
        style={{
          width:                'clamp(62px, 10vw, 88px)',
          height:               'clamp(70px, 12vw, 96px)',
          background:           'var(--mat-liquid-bg)',
          backdropFilter:       'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border:               '1px solid var(--mat-liquid-border)',
          borderRadius:         '16px',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={str}
            className="font-outfit font-bold tabular-nums"
            style={{
              lineHeight: 1,
              fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
              background: 'var(--metallic-grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ y: '70%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-70%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {str}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className="font-semibold uppercase"
        style={{ fontSize: 'clamp(9px, 1.5vw, 10px)', letterSpacing: '0.22em', color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 pb-6 sm:pb-7 self-center">
      <span className="w-[3px] h-[3px] sm:w-1 sm:h-1 rounded-full" style={{ background: 'var(--border-subtle)' }} />
      <span className="w-[3px] h-[3px] sm:w-1 sm:h-1 rounded-full" style={{ background: 'var(--border-subtle)' }} />
    </div>
  );
}

export default function RegisterCTA() {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2026-10-02T09:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="register"
      className="relative py-14 md:py-32 flex items-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="max-w-5xl mx-auto px-6 w-full text-center">

        {/* Headline */}
        <h2
          className="font-outfit font-bold tracking-tight leading-[0.9] mb-6"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
        >
          <motion.span className="block" style={{ color: 'var(--text-primary)' }} {...inViewWord(0)}>
            {t('register.titleA')}
          </motion.span>
          <motion.span
            className="inline-block gradient-text py-[0.2em] leading-[1.1]"
            style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.8rem)' }}
            {...inViewWord(0.08)}
          >
            {t('register.titleB')}
          </motion.span>
        </h2>

        {/* Subtext */}
        <motion.p
          className="text-base md:text-lg max-w-md mx-auto mb-14 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          {...inView(0.14)}
        >
          {t('register.subtext')}
        </motion.p>

        {/* Countdown */}
        <motion.div
          className="flex items-start justify-center gap-2 sm:gap-4 mb-14"
          {...inView(0.20)}
        >
          <CountCard value={timeLeft.days} label={t('countdown.days')} />
          <Colon />
          <CountCard value={timeLeft.hours} label={t('countdown.hours')} />
          <Colon />
          <CountCard value={timeLeft.minutes} label={t('countdown.minutes')} />
          <Colon />
          <CountCard value={timeLeft.seconds} label={t('countdown.seconds')} />
        </motion.div>

        {/* CTA Card */}
        <motion.div {...inView(0.26)}>
          <CtaCard
            imageSrc="/images/CTA/CTA1.png"
            titleA={t('register.cardTitleA')}
            titleB={t('register.cardTitleB')}
            description={t('register.cardSubtext')}
            buttonText={t('register.register')}
            href="/register"
          />
        </motion.div>

      </div>
    </section>
  );
}
