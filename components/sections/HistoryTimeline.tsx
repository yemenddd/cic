'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import dynamic from 'next/dynamic';

// Lazy-load particle & canvas-heavy components
const SparklesCore = dynamic(() => import('@/components/ui/sparkles').then(m => ({ default: m.Sparkles })), { ssr: false });
const Starfield = dynamic(() => import('@/components/ui/starfield').then(m => ({ default: m.Starfield })), { ssr: false });

type Edition = {
  year: string;
  title: string;
  desc: string;
  attendees: string;
  speakers: string;
  current?: boolean;
};

const ACCENTS = ['#67e8f9', '#818cf8', '#60a5fa', '#a78bfa'];
const EASE = [0.16, 1, 0.3, 1] as const;

// Each card reveals at this scroll threshold (0–1 across the whole timeline)
const CARD_THRESHOLDS = [0.02, 0.42, 0.70];

/* ── Ghost year parallax ── */
function GhostYear({ year, color }: { year: string; color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-3xl">
      <span className="font-outfit font-black leading-none"
        style={{ fontSize: 'clamp(5rem,14vw,12rem)', color, opacity: 0.07, letterSpacing: '-0.04em' }}>
        {year}
      </span>
    </div>
  );
}

/* ── Single card ── */
function Card({ edition, accent, isRtl, t, visible, fromLeft }: {
  edition: Edition; accent: string; isRtl: boolean; t: (k: string) => string;
  visible: boolean; fromLeft: boolean;
}) {
  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden w-full"
      style={{
        background: edition.current
          ? 'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(59,130,246,0.08),rgba(139,92,246,0.08))'
          : 'rgba(255,255,255,0.03)',
        border: edition.current ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: edition.current ? '0 0 40px rgba(96,165,250,0.07)' : 'none',
      }}
      initial={{ opacity: 0, x: fromLeft ? -50 : 50 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: fromLeft ? -50 : 50 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <GhostYear year={edition.year} color={accent} />
      <div className="relative z-10 p-7" dir={isRtl ? 'rtl' : 'ltr'}>

        <motion.div
          className="flex items-center gap-3 flex-wrap mb-3"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        >
          <span className="font-outfit font-black text-4xl leading-none" style={{ color: accent }}>
            {edition.year}
          </span>
          {edition.current && (
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full text-white"
              style={{ background: 'linear-gradient(to right,#06b6d4,#3b82f6,#8b5cf6)' }}>
              {t('history.currentBadge')}
            </span>
          )}
        </motion.div>

        <motion.h3
          className="font-outfit font-bold text-white leading-snug mb-3"
          style={{ fontSize: 'clamp(1.2rem,2.2vw,1.5rem)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.22, ease: EASE }}
        >
          {edition.title}
        </motion.h3>

        <motion.p
          className="text-[13px] text-white/50 leading-relaxed mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.32, ease: EASE }}
        >
          {edition.desc}
        </motion.p>

        <motion.div
          className="flex items-center gap-3 flex-wrap"
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.42, ease: EASE }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: `${accent}18`, color: accent }}>
            <span className="font-bold">{edition.attendees}</span>
            <span className="opacity-70">{t('history.attendeesLabel')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-bold">{edition.speakers}</span>
            <span className="opacity-70">{t('history.speakersLabel')}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Main export ── */
export default function HistoryTimeline() {
  const { t, tx, dir } = useLang();
  const isRtl = dir === 'rtl';
  const editions = tx<Edition[]>('history.editions') || [];

  // Scroll tracking for the whole timeline
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 90%'],
  });

  // Smooth spring for the line so it feels physical
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, restDelta: 0.001 });
  const lineScaleY = useTransform(smoothProgress, [0, 1], [0, 1]);

  // Track current scroll for card reveals
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgress(v));

  return (
    <section id="history" className="bg-[#030712] min-h-screen">

      {/* ── Hero header ── */}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Starfield background */}
        <Starfield
          starColor="rgba(255,255,255,0.8)"
          bgColor="rgba(3,7,18,1)"
          speed={0.5}
          quantity={300}
          opacity={1}
        />
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(96,165,250,0.08) 0%, transparent 70%)' }}
        />
      <div className="relative z-10 text-center px-6 py-20 max-w-4xl mx-auto w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-6"
          style={{ fontSize: 'clamp(3rem,7vw,6rem)' }}>
          <motion.span className="block text-white"
            initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8, ease: EASE }}>
            {t('history.titleA')}
          </motion.span>
          <motion.span
            className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8, ease: EASE }}>
            {t('history.titleB')}
          </motion.span>
        </h1>

        <motion.p className="text-base md:text-lg text-white/45 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}>
          {t('history.subtitle')}
        </motion.p>
      </div>
      </div>

      {/* ── Timeline ── */}
      <div ref={containerRef} className="max-w-5xl mx-auto px-6 pb-32 relative">

        {/* Faint background line */}
        <div
          className="hidden lg:block absolute top-0 bottom-0 w-px pointer-events-none"
          style={{ left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.07)' }}
        />

        {/* Animated progress line */}
        <motion.div
          className="hidden lg:block absolute top-0 w-px pointer-events-none origin-top"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 0,
            scaleY: lineScaleY,
            background: 'linear-gradient(to bottom,#06b6d4,#3b82f6,#8b5cf6)',
          }}
        />

        {/* ── Start node — top of line ── */}
        <div className="hidden lg:block absolute top-0 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: '0px' }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Pulsing ring */}
            <motion.div
              className="absolute w-8 h-8 rounded-full"
              style={{ background: 'rgba(103,232,249,0.12)', border: '1px solid rgba(103,232,249,0.3)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Dot */}
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: '#67e8f9', boxShadow: '0 0 16px #67e8f990' }}
            />
          </motion.div>
        </div>

        {/* Cards */}
        <div className="flex flex-col" style={{ paddingTop: '17vh' }}>
          {editions.slice(0, 3).map((edition, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            const visible = progress >= CARD_THRESHOLDS[i];
            const cardOnRight = isRtl ? i % 2 !== 0 : i % 2 === 0;

            return (
              <div
                key={edition.year}
                className="relative flex flex-col lg:flex-row items-center"
                style={{ minHeight: i < editions.length - 1 ? '42vh' : 'auto', paddingBottom: i < editions.length - 1 ? '8vh' : 0 }}
              >
                {/* Desktop layout */}
                <div className="hidden lg:flex items-start w-full">

                  {/* Left half */}
                  <div className="w-[calc(50%-14px)] flex justify-end pr-10">
                    {!cardOnRight && (
                      <div className="w-full max-w-[420px]">
                        <Card edition={edition} accent={accent} isRtl={isRtl} t={t} visible={visible} fromLeft={true} />
                      </div>
                    )}
                  </div>

                  {/* Node + floating year */}
                  <div className="w-[28px] shrink-0 flex justify-center pt-8 relative">
                    {/* Year label beside node */}
                    <motion.span
                      className="absolute top-6 font-outfit font-black text-sm whitespace-nowrap"
                      style={{
                        color: accent,
                        ...(cardOnRight
                          ? { left: '100%', paddingLeft: '10px' }
                          : { right: '100%', paddingRight: '10px' }),
                      }}
                      initial={{ opacity: 0 }}
                      animate={visible ? { opacity: 0.65 } : { opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                    >
                      {edition.year}
                    </motion.span>

                    <motion.div
                      className="w-5 h-5 rounded-full border-2"
                      style={{ borderColor: accent, background: '#030712', boxShadow: visible ? `0 0 20px ${accent}90` : 'none' }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                    />
                  </div>

                  {/* Right half */}
                  <div className="w-[calc(50%-14px)] flex justify-start pl-10">
                    {cardOnRight && (
                      <div className="w-full max-w-[420px]">
                        <Card edition={edition} accent={accent} isRtl={isRtl} t={t} visible={visible} fromLeft={false} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="lg:hidden flex gap-4 w-full">
                  <div className="flex flex-col items-center pt-7 shrink-0">
                    <motion.div
                      className="w-3 h-3 rounded-full border-2 shrink-0"
                      style={{ borderColor: accent, background: '#030712' }}
                      initial={{ scale: 0 }} animate={visible ? { scale: 1 } : { scale: 0 }}
                      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    />
                    {i < editions.length - 1 && (
                      <div className="flex-1 w-px mt-2"
                        style={{ background: `linear-gradient(to bottom,${accent}60,transparent)` }} />
                    )}
                  </div>
                  <div className="flex-1 pb-10">
                    <Card edition={edition} accent={accent} isRtl={isRtl} t={t} visible={visible} fromLeft={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5th edition node — line terminates here ── */}
      <div className="hidden lg:flex justify-center -mt-2 mb-2 relative z-10">
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={progress >= 0.95 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute w-10 h-10 rounded-full"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
            animate={progress >= 0.95 ? { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Node dot */}
          <div
            className="w-5 h-5 rounded-full border-2"
            style={{ borderColor: '#a78bfa', background: '#030712', boxShadow: '0 0 24px #a78bfa90' }}
          />
        </motion.div>
      </div>

      {/* ── Sparkles Finale ── */}
      <div className="max-w-5xl mx-auto px-6 pb-32">
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          style={{ height: '380px' }}
          initial={{ opacity: 0, y: 40 }}
          animate={progress >= 0.95 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {/* Sparkles background */}
          <SparklesCore
            background="transparent"
            minSize={0.6}
            size={1.8}
            density={90}
            color="#818cf8"
            speed={1.2}
            className="absolute inset-0 w-full h-full"
          />

          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(96,165,250,0.12) 0%, transparent 70%)' }}
          />

          {/* Content — 4th edition finale */}
          {editions[3] && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10" dir={isRtl ? 'rtl' : 'ltr'}>
              <motion.div
                className="flex items-center gap-3 mb-5 flex-wrap justify-center"
                initial={{ opacity: 0, y: 16 }}
                animate={progress >= 0.97 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              >
                <span className="font-outfit font-black text-5xl leading-none text-white">
                  {editions[3].year}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
                >
                  {t('history.currentBadge')}
                </span>
              </motion.div>

              <motion.h2
                className="font-outfit font-bold leading-[0.9] tracking-tight mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
                initial={{ opacity: 0, y: 24 }}
                animate={progress >= 0.97 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
              >
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent inline-block py-[0.15em] leading-[1.1]">
                  {editions[3].title}
                </span>
              </motion.h2>

              <motion.p
                className="text-sm text-white/50 max-w-sm leading-relaxed"
                initial={{ opacity: 0 }}
                animate={progress >= 0.97 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                {editions[3].desc}
              </motion.p>

              {/* Quote line */}
              <motion.p
                className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35 mt-4 mb-1"
                initial={{ opacity: 0 }}
                animate={progress >= 0.97 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
              >
                {t('history.ambition')}
              </motion.p>

              <motion.div
                className="flex items-center gap-3 mt-4 flex-wrap justify-center"
                initial={{ opacity: 0 }}
                animate={progress >= 0.97 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
                  <span className="font-bold">{editions[3].attendees}</span>
                  <span className="opacity-70">{t('history.attendeesLabel')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  <span className="font-bold">{editions[3].speakers}</span>
                  <span className="opacity-70">{t('history.speakersLabel')}</span>
                </div>
              </motion.div>
            </div>
          )}

          {/* Bottom border glow */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, #06b6d4, #3b82f6, #8b5cf6, transparent)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
