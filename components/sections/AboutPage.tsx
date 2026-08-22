'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, FlaskConical, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';
import CircularGallerySection from '@/components/sections/CircularGallerySection';

/* ─── Animated counter ─── */
function Counter({ target, suffix = '', visible }: { target: number; suffix?: string; visible: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) { setCount(0); return; }
    const duration = 2000;
    const start = performance.now();
    let id: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) id = requestAnimationFrame(step);
      else setCount(target);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [visible, target]);
  return <>{count.toLocaleString('en-US')}{suffix}</>;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.55, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 56 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.7, delay, ease: EASE },
});

/* ─── Elegant floating shape ─── */
function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.12]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.06)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]",
          )}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Grid background ─── */
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none" style={{
    backgroundImage: 'linear-gradient(var(--mat-liquid-border) 1px, transparent 1px), linear-gradient(to right, var(--mat-liquid-border) 1px, transparent 1px)',
    backgroundSize: '3rem 3rem',
    maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
  }} />
);

const PILLAR_ICONS = [Lightbulb, FlaskConical, Users];

const STAT_META = [
  { target: 4,   suffix: '' },
  { target: 500, suffix: '+' },
  { target: 12,  suffix: '+' },
  { target: 4,   suffix: '' },
];

/* ─────────────────────────────────────────
   SECTION 1 — Hero
───────────────────────────────────────── */
function HeroSection() {
  const { t, dir } = useLang();
  return (
    <div className="relative h-screen">
      <div className="h-full w-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape delay={0.3} width={600} height={140} rotate={12} gradient="from-indigo-500/[0.15]" className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" />
          <ElegantShape delay={0.5} width={500} height={120} rotate={-15} gradient="from-rose-500/[0.15]" className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" />
          <ElegantShape delay={0.4} width={300} height={80} rotate={-8} gradient="from-violet-500/[0.15]" className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" />
          <ElegantShape delay={0.6} width={200} height={60} rotate={20} gradient="from-amber-500/[0.15]" className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]" />
          <ElegantShape delay={0.7} width={150} height={40} rotate={-25} gradient="from-cyan-500/[0.15]" className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 40%, var(--bg-base) 85%)' }}
        />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" dir={dir}>
          <h1 className="font-outfit font-bold leading-[0.88] tracking-tight mb-8"
            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
            <motion.span
              className="block"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: EASE }}
            >
              {t('about.heroWord1')}
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 56 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
            >
              {t('about.heroWord2')}
            </motion.span>
          </h1>
          <motion.p
            className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6, ease: EASE }}
          >
            {t('about.heroTagline')}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 2 — Mission / Story
───────────────────────────────────────── */
function MissionSection() {
  const { t, dir } = useLang();
  const { theme } = useTheme();
  return (
    <div className="relative" style={{ background: theme === 'light' ? '#ffffff' : 'var(--bg-base)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-full"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />
        <div className="absolute left-0 bottom-0 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20 md:py-32">
        <div className={`flex flex-col ${dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 lg:gap-20`}>

          {/* Yemen map */}
          <motion.div
            className="flex shrink-0 w-[220px] sm:w-[320px] lg:w-[460px] items-center justify-center"
            initial={{ opacity: 0, x: dir === 'rtl' ? 60 : -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <img
              src="/images/logos/yemen.png"
              alt="Yemen map"
              loading="lazy"
              decoding="async"
              className="w-full h-auto object-contain drop-shadow-[0_0_60px_rgba(59,130,246,0.15)]"
            />
          </motion.div>

          {/* Text */}
          <div className="flex-1" dir={dir}>
            <h2 className="font-outfit font-black tracking-tight mb-10"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)', letterSpacing: '-0.02em' }}>
              <motion.span
                className="block"
                style={{ lineHeight: 1, paddingTop: '0.15em', paddingBottom: '0.15em', color: 'var(--text-primary)' }}
                {...inViewWord(0)}
              >
                {t('about.missionTitleA')}
              </motion.span>
              <motion.span
                className="block"
                style={{
                  lineHeight: 1.1,
                  paddingTop: '0.1em',
                  paddingBottom: '0.3em',
                  background: 'var(--gradient-text)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
                {...inViewWord(0.1)}
              >
                {t('about.missionTitleB')}
              </motion.span>
            </h2>

            <motion.div className="space-y-5 max-w-2xl" {...inView(0.15)}>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {t('about.missionP1')}
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                {t('about.missionP2')}
              </p>
            </motion.div>

            <motion.div className="mt-10" {...inView(0.22)}>
              <Link
                href="/history"
                dir={dir}
                className="inline-flex items-center gap-2.5 text-sm font-semibold group"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={15} style={{ color: 'var(--text-tertiary)' }} className="transition-transform duration-200 group-hover:-translate-x-1" />
                {t('about.missionLink')}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 2.5 — President's Speech
───────────────────────────────────────── */
function PresidentSection() {
  const { t, dir } = useLang();

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#020509' }}>

      {/* Full-bleed photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/about/president.jpg"
          alt={t('about.presidentImgAlt')}
          loading="lazy"
          decoding="async"
          className="hidden md:block w-full h-full object-cover"
          style={{ objectPosition: '30% 20%' }}
        />
        <img
          src="/images/about/president-mobile.jpg"
          alt={t('about.presidentImgAlt')}
          loading="lazy"
          decoding="async"
          className="block md:hidden w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
          onError={(e) => {
            e.currentTarget.src = "/images/about/president.jpg";
            e.currentTarget.style.objectPosition = "30% 20%";
          }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,5,9,0.4) 0%, transparent 30%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(2,5,9,0.95) 0%, rgba(2,5,9,0.80) 20%, rgba(2,5,9,0.4) 40%, transparent 58%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,5,9,0.6) 0%, transparent 15%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(2,5,9,0.8) 0%, transparent 20%)' }} />
      </div>

      <div
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[55%] h-[80%] z-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex items-center justify-end min-h-screen px-6 pt-64 pb-20 md:py-20" dir="ltr">
        <div className="w-full md:w-[540px] max-w-[540px] md:mr-[8%] lg:mr-[14%]">
          <motion.div
            className="p-6 md:p-8 rounded-3xl"
            style={{
              background:           'rgba(8,10,16,0.80)',
              backdropFilter:       'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border:               '1px solid rgba(255,255,255,0.08)',
            }}
            dir={dir}
            {...inView(0)}
          >
            <h2
              className="font-bold mb-8 leading-tight"
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
                fontFamily: 'var(--font-thmanyah)',
                color: '#ffffff',
              }}
            >
              {t('about.presidentTitle')}
            </h2>

            <div
              className="mb-2 select-none"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(3.5rem, 6vw, 6rem)',
                lineHeight: 0.75,
                background: 'linear-gradient(135deg, #67e8f9 0%, #60a5fa 50%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                opacity: 0.3,
              }}
            >
              &ldquo;
            </div>

            <div className="space-y-4 mb-8">
              <p
                className="leading-[1.8]"
                style={{ fontSize: 'clamp(1.05rem, 1.5vw, 1.25rem)', fontWeight: 500, color: 'rgba(255,255,255,0.90)' }}
              >
                {t('about.presidentQ1')}
              </p>
              <p
                className="leading-[1.8]"
                style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.05rem)', fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}
              >
                {t('about.presidentQ2')}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-[3px] rounded-full flex-shrink-0 self-stretch"
                style={{ background: 'linear-gradient(to bottom, #67e8f9, #8b5cf6)' }}
              />
              <div className="space-y-1">
                <p
                  className="font-bold"
                  style={{ fontSize: 'clamp(1rem, 1.3vw, 1.15rem)', fontFamily: 'var(--font-thmanyah)', color: '#ffffff' }}
                >
                  {t('about.presidentName')}
                </p>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t('about.presidentRole1')}
                </p>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {t('about.presidentRole2')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 3 — Stats
───────────────────────────────────────── */
function StatsSection() {
  const { t, tx, dir } = useLang();
  const statsRef = useRef<HTMLDivElement>(null);
  const [inViewStat, setInViewStat] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInViewStat(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statLabels = tx<{ label: string }[]>('about.statsItems');
  const stats = STAT_META.map((m, i) => ({ ...m, label: statLabels?.[i]?.label ?? '' }));

  return (
    <div className="relative py-20 md:py-32" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Grid />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-center" dir={dir}>
        <h2 className="font-outfit font-black tracking-tight mb-16"
          style={{ fontSize: 'clamp(2.6rem, 5vw, 4.5rem)', letterSpacing: '-0.02em' }}>
          <motion.span
            className="block"
            style={{ lineHeight: 1, paddingTop: '0.15em', paddingBottom: '0.15em', color: 'var(--text-primary)' }}
            {...inViewWord(0)}
          >
            {t('about.statsTitleA')}
          </motion.span>
          <motion.span
            className="block"
            style={{
              lineHeight: 1.1,
              paddingTop: '0.1em',
              paddingBottom: '0.45em',
              background: 'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
            {...inViewWord(0.1)}
          >
            {t('about.statsTitleB')}
          </motion.span>
        </h2>

        <motion.div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-4 w-full gap-y-10 sm:gap-y-0"
          {...inView(0.15)}
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="flex flex-col items-center gap-3 px-4 py-2 w-full">
                <span
                  className="font-outfit font-black tabular-nums leading-none"
                  style={{ fontSize: 'clamp(2.2rem, 4vw, 4.2rem)', color: 'var(--text-primary)' }}
                >
                  <Counter target={stat.target} suffix={stat.suffix} visible={inViewStat} />
                </span>
                <span
                  className="text-sm sm:text-base tracking-[0.06em] uppercase font-medium text-center"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {stat.label}
                </span>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden sm:block w-px h-10 shrink-0" style={{ background: 'var(--mat-liquid-border)' }} />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION 4 — Values / Pillars
───────────────────────────────────────── */
function ValuesSection() {
  const { t, tx, dir } = useLang();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isRtl = dir === 'rtl';

  const pillarData = tx<{ title: string; body: string }[]>('about.pillars');
  const pillars = PILLAR_ICONS.map((Icon, i) => ({
    icon: Icon,
    num: String(i + 1).padStart(2, '0'),
    title: pillarData?.[i]?.title ?? '',
    body:  pillarData?.[i]?.body  ?? '',
  }));

  return (
    <div
      className="relative py-24 md:py-36"
      style={{ background: isLight ? '#fafafa' : 'var(--bg-base)' }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full" dir={dir}>

        {/* ── Heading ── */}
        <div className="mb-16 lg:mb-24 text-center">
          <motion.h2
            className="font-outfit font-black"
            style={{
              fontSize:      'clamp(2.8rem, 5.5vw, 5.5rem)',
              lineHeight:    1.05,
              color:         'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
            {...inViewWord(0)}
          >
            {t('about.valsTitleA')}
          </motion.h2>
          <motion.h2
            className="font-outfit font-black"
            style={{
              fontSize:            'clamp(2.8rem, 5.5vw, 5.5rem)',
              lineHeight:          1.1,
              letterSpacing:       '-0.02em',
              paddingBottom:       '0.15em',
              background:          'var(--gradient-text)',
              WebkitBackgroundClip:'text',
              backgroundClip:      'text',
              WebkitTextFillColor: 'transparent',
              color:               'transparent',
            }}
            {...inViewWord(0.08)}
          >
            {t('about.valsTitleB')}
          </motion.h2>
        </div>

        {/* ── Pillar cards ── */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-7">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              {...inView(i * 0.12)}
              className="relative flex flex-col overflow-hidden"
              style={{
                borderRadius: 20,
                background:   isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                border:       '1px solid var(--mat-liquid-border)',
                padding:      'clamp(28px, 4vw, 44px)',
              }}
            >
              {/* Faded giant number — decorative */}
              <span
                className="absolute select-none pointer-events-none font-black"
                style={{
                  fontFamily: 'var(--font-outfit)',
                  fontSize:   'clamp(6rem, 12vw, 10rem)',
                  lineHeight: 1,
                  color:      'var(--text-primary)',
                  opacity:    0.035,
                  bottom:     -8,
                  ...(isRtl ? { left: 12 } : { right: 12 }),
                }}
              >
                {pillar.num}
              </span>

              {/* Small number tag */}
              <span
                className="font-black block mb-8"
                style={{
                  fontFamily:    'var(--font-outfit)',
                  fontSize:      11,
                  letterSpacing: '0.22em',
                  color:         'var(--text-tertiary)',
                }}
              >
                {pillar.num}
              </span>

              {/* Icon */}
              <pillar.icon
                size={20}
                className="mb-6 shrink-0"
                style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
              />

              {/* Title */}
              <h3
                className="font-outfit font-black mb-3"
                style={{
                  fontSize:      'clamp(1.3rem, 2.2vw, 1.65rem)',
                  color:         'var(--text-primary)',
                  lineHeight:    1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                {pillar.title}
              </h3>

              {/* Body */}
              <p
                className="leading-relaxed"
                style={{
                  fontSize: 'clamp(13px, 1.4vw, 15px)',
                  color:    'var(--text-secondary)',
                }}
              >
                {pillar.body}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────── */
export default function AboutPage() {
  return (
    <main style={{ background: 'var(--bg-base)' }}>
      <HeroSection />
      <MissionSection />
      <PresidentSection />
      <StatsSection />
      <CircularGallerySection />
      <ValuesSection />
    </main>
  );
}
