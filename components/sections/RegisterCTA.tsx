'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { useLang } from '@/lib/i18n';

function CountCard({ value, label }: { value: number; label: string }) {
  const str = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className="relative overflow-hidden flex items-center justify-center rounded-xl sm:rounded-2xl w-[62px] h-[70px] sm:w-[88px] sm:h-24"
        style={{
          background: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'rgba(0,0,0,0.4)' }} />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={str}
            className="font-outfit font-bold text-white tabular-nums text-[1.7rem] sm:text-[2.4rem]"
            style={{ lineHeight: 1 }}
            initial={{ y: '70%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-70%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {str}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 pb-6 sm:pb-7 self-center">
      <span className="w-[3px] h-[3px] sm:w-1 sm:h-1 rounded-full bg-white/15" />
      <span className="w-[3px] h-[3px] sm:w-1 sm:h-1 rounded-full bg-white/15" />
    </div>
  );
}

export default function RegisterCTA() {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const target = new Date('2026-08-15T09:00:00').getTime();
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

  const handleNotify = () => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setNotified(true);
  };

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setCurrentP(v));

  const reveal = (threshold: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  });

  const revealWord = (threshold: number) => ({
    initial: { opacity: 0, y: 48 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div
      ref={sectionRef}
      id="register"
      className="relative h-[150vh] md:h-[200vh]"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden" style={{ background: 'var(--bg-base)' }}>

        {/* Ambient spotlight */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)' }}
        />
        {/* Faint grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 w-full text-center">

          {/* Headline */}
          <h2
            className="font-outfit font-bold tracking-tight leading-[0.9] mb-6"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
          >
            <motion.span className="block text-white" {...revealWord(0.08)}>
              {t('register.titleA')}
            </motion.span>
            <motion.span
              className="inline-block gradient-text py-[0.2em] leading-[1.1]"
              {...revealWord(0.15)}
            >
              {t('register.titleB')}
            </motion.span>
          </h2>

          {/* Subtext */}
          <motion.p
            className="text-base md:text-lg text-white/45 max-w-md mx-auto mb-14 leading-relaxed"
            {...reveal(0.22)}
          >
            {t('register.subtext')}
          </motion.p>

          {/* Countdown */}
          <motion.div
            className="flex items-start justify-center gap-2 sm:gap-4 mb-14"
            {...reveal(0.28)}
          >
            <CountCard value={timeLeft.days} label={t('countdown.days')} />
            <Colon />
            <CountCard value={timeLeft.hours} label={t('countdown.hours')} />
            <Colon />
            <CountCard value={timeLeft.minutes} label={t('countdown.minutes')} />
            <Colon />
            <CountCard value={timeLeft.seconds} label={t('countdown.seconds')} />
          </motion.div>

          {/* Primary CTA */}
          <motion.div {...reveal(0.34)} className="mb-6">
            <ShinyButton href="/register" size="lg">
              {t('register.register')} →
            </ShinyButton>
          </motion.div>

          {/* Email capture */}
          <motion.div className="mb-14" {...reveal(0.40)}>
            <p className="text-[12px] text-white/30 mb-3">{t('register.notify')}</p>
            <div className="max-w-sm mx-auto">
              <AnimatePresence mode="wait">
                {notified ? (
                  <motion.p
                    key="confirmed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm gradient-text opacity-80 w-full text-center py-3"
                  >
                    {t('register.confirmed')}
                  </motion.p>
                ) : (
                  <motion.div
                    key="form"
                    className="flex items-center gap-2 p-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
                      placeholder={t('register.emailPlaceholder')}
                      className="flex-1 min-w-0 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/25 outline-none"
                    />
                    <motion.button
                      onClick={handleNotify}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold text-white"
                      style={{ background: 'rgba(255,255,255,0.10)' }}
                    >
                      {t('register.notifyBtn')}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Info chips */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/35"
            {...reveal(0.47)}
          >
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-blue-400/60" />
              {t('register.chipDate')}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-blue-400/60" />
              {t('register.chipLocation')}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-white/15" />
            <span className="flex items-center gap-1.5">
              <Users size={12} className="text-blue-400/60" />
              {t('register.chipAttendees')}
            </span>
          </motion.div>

        </div>

        {/* Bottom fade to blend seamlessly with the next section */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 z-20" style={{ background: 'linear-gradient(to top, var(--bg-base), transparent)' }} />
      </div>
    </div>
  );
}
