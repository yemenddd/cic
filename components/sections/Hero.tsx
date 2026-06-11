'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';

const HeroWave = dynamic(() => import('@/components/ui/hero-wave'), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const { t, dir, lang } = useLang();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

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
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => { clearInterval(id); window.removeEventListener('resize', onResize); };
  }, []);

  /* ── Scroll choreography ── */
  const robotX     = useTransform(scrollYProgress, [0, 0.5], ['0%', isDesktop ? '22%' : '0%']);
  const robotScale = useTransform(scrollYProgress, [0, 0.35], [isDesktop ? 1 : 1.35, isDesktop ? 0.8 : 0.98]);

  const [maxP, setMaxP]       = useState(0);
  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setCurrentP(v);
    setMaxP(prev => (v > prev ? v : prev));
  });

  const reveal = (threshold: number) => isDesktop
    ? ({
        initial:    { opacity: 0, y: 28 },
        animate:    { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 },
        transition: { duration: 0.5, ease: EASE },
      })
    : ({
        initial:    { opacity: 0, y: 28 },
        animate:    { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: threshold * 1.5, ease: EASE },
      });

  const revealWord = (threshold: number) => isDesktop
    ? ({
        initial:    { opacity: 0, y: 48 },
        animate:    { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
        transition: { duration: 0.6, ease: EASE },
      })
    : ({
        initial:    { opacity: 0, y: 48 },
        animate:    { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: threshold * 2, ease: EASE },
      });

  const T = { w1: 0.04, w2: 0.08, w3: 0.13, tagline: 0.22, desc: 0.30, btns: 0.35, cd: 0.47 };

  const countdownItems = [
    { label: t('countdown.days'),    value: timeLeft.days    },
    { label: t('countdown.hours'),   value: timeLeft.hours   },
    { label: t('countdown.minutes'), value: timeLeft.minutes },
    { label: t('countdown.seconds'), value: timeLeft.seconds },
  ];

  const isRtl = dir === 'rtl';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section ref={sectionRef} className="relative h-[250vh] md:h-[300vh]" style={{ background: '#000' }}>
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">

        {/* ── Apple-style background ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">

          {/* Noise texture — faint grain like Apple product pages */}
          <div
            className="absolute inset-0 z-0 opacity-[0.028]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px',
            }}
          />

          {/* Deep indigo glow — primary, behind text side */}
          <div
            className="absolute rounded-full"
            style={{
              width: '80vw', height: '80vw',
              top: '-20%',
              left: isRtl ? 'auto' : '-15%',
              right: isRtl ? '-15%' : 'auto',
              background: 'radial-gradient(circle, rgba(67,56,202,0.20) 0%, rgba(49,46,129,0.10) 40%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Subtle violet depth — opposite corner */}
          <div
            className="absolute rounded-full"
            style={{
              width: '70vw', height: '70vw',
              bottom: '-25%',
              right: isRtl ? 'auto' : '0%',
              left: isRtl ? '0%' : 'auto',
              background: 'radial-gradient(circle, rgba(109,40,217,0.16) 0%, rgba(76,29,149,0.09) 45%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Ultra-faint blue center shimmer — like Apple product hero */}
          <div
            className="absolute rounded-full"
            style={{
              width: '50vw', height: '50vw',
              top: '15%', left: '50%',
              transform: 'translateX(-50%)',
              background: 'radial-gradient(circle, rgba(29,78,216,0.13) 0%, transparent 65%)',
              filter: 'blur(100px)',
            }}
          />

          {/* Barely-visible dot grid — Apple.com product page signature */}
          <div
            className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
            }}
          />
        </div>

        {/* Wave — mobile only */}
        <div className="md:hidden absolute inset-0 z-10">
          <HeroWave />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
        </div>

        {/* Spline robot — desktop only */}
        {isDesktop && (
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
        )}

        {/* ── Text panel ── */}
        <div className="absolute inset-0 z-30 flex items-center pointer-events-none">
          <div className={`max-w-7xl mx-auto px-6 w-full flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[560px] w-full">

              {/* Headline */}
              <h1 className={`mb-6 drop-shadow-[0_2px_30px_rgba(0,0,0,0.7)] flex flex-col gap-0 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                {lang === 'ar' ? (
                  <>
                    <span className="block w-full text-right -mb-10 md:-mb-20">
                      <motion.span className="inline-block" {...revealWord(T.w2)}>
                        <img
                          src="/images/logos/من_العقل.svg"
                          alt="من العقل"
                          className="object-right translate-x-[4%] md:translate-x-[6%] w-[280px] sm:w-[400px] md:w-[500px] max-w-full h-auto"
                          style={{ filter: 'brightness(0) invert(1)' }}
                        />
                      </motion.span>
                    </span>
                    <span className="block w-full text-right">
                      <motion.span className="inline-block" {...revealWord(T.w3)}>
                        <span
                          dir="rtl"
                          style={{
                            fontFamily: 'var(--font-thmanyah)',
                            fontWeight: 900,
                            fontSize:   'clamp(4rem, 11vw, 7.5rem)',
                            lineHeight: 1.05,
                            display:    'inline-block',
                            paddingTop: '0.1em',
                            paddingBottom: '0.2em',
                            background: 'var(--gradient-text)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor:  'transparent',
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
                      <motion.span className="inline-block text-white" {...revealWord(T.w2)}>
                        <span
                          dir="ltr"
                          style={{
                            fontFamily: 'var(--font-outfit)',
                            fontWeight: 900,
                            fontSize:   'clamp(4rem, 10vw, 7rem)',
                            lineHeight: 1.05,
                            display:    'inline-block',
                          }}
                        >
                          {t('hero.word1')} {t('hero.word2')}
                        </span>
                      </motion.span>
                    </span>
                    <span className="block w-full text-left -mt-2 md:-mt-3">
                      <motion.span className="inline-block" {...revealWord(T.w3)}>
                        <span
                          dir="ltr"
                          style={{
                            fontFamily: 'var(--font-outfit)',
                            fontWeight: 900,
                            fontSize:   'clamp(4rem, 10vw, 7rem)',
                            lineHeight: 1.05,
                            display:    'inline-block',
                            paddingTop: '0.1em',
                            paddingBottom: '0.2em',
                            background: 'var(--gradient-text)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor:  'transparent',
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

              {/* Description */}
              <motion.p
                className="text-base md:text-[1.0625rem] mb-9 max-w-md leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
                {...reveal(T.desc)}
              >
                {t('hero.description')}
              </motion.p>

              {/* Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-12 pointer-events-auto"
                {...reveal(T.btns)}
              >
                <Link
                  href="/register"
                  className="btn-primary text-center"
                >
                  {t('hero.cta1')}
                </Link>
                <Link
                  href="/program"
                  className="btn-ghost flex items-center justify-center gap-2 text-center"
                >
                  {t('hero.cta2')}
                  <ArrowIcon size={15} className="shrink-0" />
                </Link>
              </motion.div>

              {/* Countdown */}
              <motion.div {...reveal(T.cd)}>
                <p className="text-caption mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {t('hero.countdownLabel')}
                </p>
                <div className="flex items-center gap-2 sm:gap-3">
                  {countdownItems.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                      {/* Glass countdown card */}
                      <div
                        className="flex flex-col items-center justify-center"
                        style={{
                          minWidth:    '64px',
                          padding:     '10px 8px',
                          background:  'var(--glass-bg)',
                          backdropFilter: 'blur(24px)',
                          WebkitBackdropFilter: 'blur(24px)',
                          border:      '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow:   'inset 0 1px 0 var(--glass-shine)',
                        }}
                      >
                        <span
                          className="font-outfit font-bold tabular-nums leading-none"
                          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', color: '#fff' }}
                        >
                          {item.value.toString().padStart(2, '0')}
                        </span>
                        <span className="mt-1.5 text-caption" style={{ letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
                          {item.label}
                        </span>
                      </div>
                      {i < countdownItems.length - 1 && (
                        <span
                          className="text-2xl font-light -mt-4 select-none"
                          style={{ color: 'var(--text-disabled)' }}
                        >
                          :
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          animate={{ opacity: maxP > 0.04 ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-caption" style={{ color: 'var(--text-disabled)' }}>
            {t('hero.scroll')}
          </span>
          <div
            className="w-5 h-8 rounded-full flex justify-center pt-1.5"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <motion.span
              className="w-1 h-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.45)' }}
              animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
