'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Button, KIND, SIZE } from 'baseui/button';
import { ArrowRight } from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { useLang } from '@/lib/i18n';

export default function Hero() {
  const { t, dir, lang } = useLang();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isDesktop, setIsDesktop] = useState(true);

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    // ── Countdown ──
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
    const countdownId = setInterval(tick, 1000);

    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(countdownId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const countdownItems = [
    { label: t('countdown.days'), value: timeLeft.days },
    { label: t('countdown.hours'), value: timeLeft.hours },
    { label: t('countdown.minutes'), value: timeLeft.minutes },
    { label: t('countdown.seconds'), value: timeLeft.seconds },
  ];

  // ── Scroll choreography ──
  // Robot drifts right + scales down as the content reveals
  const robotX = useTransform(scrollYProgress, [0, 0.5], ['0%', isDesktop ? '22%' : '0%']);
  const robotScale = useTransform(scrollYProgress, [0, 0.35], [isDesktop ? 1 : 1.35, isDesktop ? 0.8 : 0.98]);

  // Two scroll trackers:
  // - maxP: only increases — used to hide the scroll cue once scrolling starts
  // - currentP: current live position — drives all reveals bidirectionally:
  //     scroll DOWN past threshold → reveals and stays (currentP stays >= threshold)
  //     scroll UP below threshold  → slides/fades back out
  const [maxP, setMaxP] = useState(0);
  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setCurrentP(v);
    setMaxP((prev) => (v > prev ? v : prev));
  });

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
  // Delay text reveals on mobile so the robot has time to scale down and be fully visible first
  const mobileOffset = isDesktop ? 0 : 0.35;
  const wordThresholds = [0.04 + mobileOffset, 0.08 + mobileOffset];
  const tTitle3 = 0.13 + mobileOffset;
  const tTagline = 0.22 + mobileOffset;
  const tDesc = 0.3 + mobileOffset;
  const tButtons = 0.35 + mobileOffset;

  return (
    <section ref={sectionRef} className="relative h-[250vh] md:h-[300vh] bg-[#030712]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">

        {/* ── Robot — centered on load, drifts right + scales on scroll ── */}
        <motion.div className="absolute inset-0 z-10" style={{ x: robotX, scale: robotScale }}>
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </motion.div>
        </motion.div>

        {/* ── Text panel ── */}
        <div className="absolute inset-0 z-30 flex items-center pointer-events-none">
          <div className={`max-w-7xl mx-auto px-6 w-full flex ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
            <motion.div 
              className="max-w-xl w-full p-6 sm:p-8 md:p-0 rounded-[2rem] bg-[#030712]/30 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none border border-white/10 md:border-transparent mt-24 sm:mt-16 md:mt-0"
              {...reveal(isDesktop ? 0.01 : mobileOffset)}
            >

              <h1 className={`mb-2 drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)] flex flex-col gap-0 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                {lang === 'ar' ? (
                  <>
                    <span className="block w-full text-right -mb-10 md:-mb-20">
                      <motion.span className="inline-block" {...revealWord(wordThresholds[0])}>
                        <img
                          src="/من_العقل.svg"
                          alt="من العقل"
                          className="object-right translate-x-[4%] md:translate-x-[6%] w-[280px] sm:w-[400px] md:w-[500px] max-w-full h-auto"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                      </motion.span>
                    </span>
                    <span className="block w-full text-right">
                      <motion.span className="inline-block" {...revealWord(tTitle3)}>
                        <span
                          dir="rtl"
                          style={{
                            fontFamily: 'var(--font-thmanyah)',
                            fontWeight: 900,
                            fontSize: 'clamp(4rem, 11vw, 7.5rem)',
                            lineHeight: 1.1,
                            display: 'inline-block',
                            paddingTop: '0.1em',
                            paddingBottom: '0.2em',
                            background: 'linear-gradient(to right, #67e8f9, #60a5fa, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
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
                      <motion.span className="inline-block text-white" {...revealWord(wordThresholds[0])}>
                        <span
                          dir="ltr"
                          style={{
                            fontFamily: 'var(--font-outfit)',
                            fontWeight: 900,
                            fontSize: 'clamp(4rem, 10vw, 7rem)',
                            lineHeight: 1.1,
                            display: 'inline-block',
                          }}
                        >
                          {t('hero.word1')} {t('hero.word2')}
                        </span>
                      </motion.span>
                    </span>
                    <span className="block w-full text-left -mt-2 md:-mt-4">
                      <motion.span className="inline-block" {...revealWord(tTitle3)}>
                        <span
                          dir="ltr"
                          style={{
                            fontFamily: 'var(--font-outfit)',
                            fontWeight: 900,
                            fontSize: 'clamp(4rem, 10vw, 7rem)',
                            lineHeight: 1.1,
                            display: 'inline-block',
                            paddingTop: '0.1em',
                            paddingBottom: '0.2em',
                            background: 'linear-gradient(to right, #67e8f9, #60a5fa, #8b5cf6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {t('hero.word3')}
                        </span>
                      </motion.span>
                    </span>
                  </>
                )}
              </h1>

              {/* Accent divider + tagline — scroll reveal */}
              <motion.div className="flex items-center gap-3 mb-7" {...reveal(tTagline)}>
                <span className="block h-px w-20 bg-blue-400/60" />
                <span className="text-[13px] md:text-[14px] font-semibold tracking-[0.25em] text-blue-400 opacity-90">
                  {t('hero.tagline')}
                </span>
              </motion.div>

              {/* Description — scroll reveal */}
              <motion.p
                className="text-base md:text-lg text-white/55 mb-10 max-w-md leading-relaxed font-light"
                {...reveal(tDesc)}
              >
                {t('hero.description')}
              </motion.p>

              {/* Buttons — scroll reveal */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-12 pointer-events-auto"
                {...reveal(tButtons)}
              >
                <Button
                  size={SIZE.large}
                  overrides={{
                    BaseButton: {
                      style: {
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        backgroundColor: 'white',
                        color: 'black',
                        ':hover': { backgroundColor: '#dbeafe' },
                        paddingLeft: '2.25rem',
                        paddingRight: '2.25rem',
                        borderTopLeftRadius: '14px',
                        borderTopRightRadius: '14px',
                        borderBottomLeftRadius: '14px',
                        borderBottomRightRadius: '14px',
                        boxShadow: '0 0 40px rgba(96,165,250,0.28)',
                        transition: 'all 0.2s ease',
                      },
                    },
                  }}
                >
                  {t('hero.cta1')}
                </Button>
                <Button
                  size={SIZE.large}
                  kind={KIND.tertiary}
                  overrides={{
                    BaseButton: {
                      style: {
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        ':hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                        paddingLeft: '1.75rem',
                        paddingRight: '1.75rem',
                        borderTopLeftRadius: '14px',
                        borderTopRightRadius: '14px',
                        borderBottomLeftRadius: '14px',
                        borderBottomRightRadius: '14px',
                        borderTopWidth: '1px',
                        borderRightWidth: '1px',
                        borderBottomWidth: '1px',
                        borderLeftWidth: '1px',
                        borderTopStyle: 'solid',
                        borderRightStyle: 'solid',
                        borderBottomStyle: 'solid',
                        borderLeftStyle: 'solid',
                        borderTopColor: 'rgba(255,255,255,0.14)',
                        borderRightColor: 'rgba(255,255,255,0.14)',
                        borderBottomColor: 'rgba(255,255,255,0.14)',
                        borderLeftColor: 'rgba(255,255,255,0.14)',
                        backdropFilter: 'blur(8px)',
                      },
                    },
                  }}
                >
                  {t('hero.cta2')} <ArrowRight className="ms-2 w-4 h-4" />
                </Button>
              </motion.div>

              {/* Countdown — scroll reveal */}
              <motion.div {...reveal(0.47)}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-semibold text-white/45 uppercase tracking-[0.18em]">
                    {t('hero.countdownLabel')}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-5">
                  {countdownItems.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-3 sm:gap-5">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl md:text-4xl font-bold font-outfit text-white tabular-nums leading-none">
                          {item.value.toString().padStart(2, '0')}
                        </span>
                        <span className="mt-1.5 text-[10px] font-medium text-white/40 uppercase tracking-widest">
                          {item.label}
                        </span>
                      </div>
                      {i < countdownItems.length - 1 && (
                        <span className="text-2xl md:text-3xl font-light text-white/20 -mt-3">:</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue — hides once the reveal begins */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          animate={{ opacity: maxP > 0.04 ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{t('hero.scroll')}</span>
          <div className="w-5 h-8 rounded-full border border-white/15 flex justify-center pt-1.5">
            <motion.span
              className="w-1 h-1.5 rounded-full bg-white/50"
              animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
