'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { dict } from '@/lib/dictionary';
import dynamic from 'next/dynamic';

// Lazy-load particles — only needed after hero section scrolls into view
const SparklesCore = dynamic(() => import('@/components/ui/sparkles').then(m => ({ default: m.SparklesCore })), { ssr: false });
const GalleryRegisterHero = dynamic(() => import('@/components/sections/GalleryRegisterHero'), { ssr: false });

/* ─── Session card data ─── */
type Session = {
  readonly time: string;
  readonly title: string;
  readonly speaker: string;
  readonly role: string;
  readonly img: string;
  readonly color: string;
};

/* ─── Collapsed peek offsets (cards stacked behind each other) ─── */
const COLLAPSED_OFFSETS = [
  'top-6',
  'top-[calc(1.5rem+0.6rem)]',
  'top-[calc(1.5rem+1.2rem)]',
  'top-[calc(1.5rem+1.8rem)]',
];

/* ─── Expanded offsets: card height (h-36 = 144px) + gap (1rem = 16px) per step ─── */
const EXPANDED_OFFSETS = [
  'top-6',
  'top-[calc(1.5rem+144px+1rem)]',
  'top-[calc(1.5rem+288px+2rem)]',
  'top-[calc(1.5rem+432px+3rem)]',
];

/* ─── Stacked day cards ─── */
function DayStack({ day, sessions, label, date, collapseLabel }: {
  day: number;
  sessions: readonly Session[];
  label: string;
  date: string;
  collapseLabel: string;
}) {
  const [isActive, setIsActive] = useState(false);

  /* total expanded height = n * 144px + (n-1) * 16px + 1.5rem top offset + 40px collapse btn */
  const expandedHeight = sessions.length * 144 + (sessions.length - 1) * 16 + 24 + 40;

  return (
    <div className="flex flex-col">
      {/* Day header */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: day * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-outfit font-bold text-white mb-2"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
          {label}
        </h2>
        <p className="text-white/40 text-base">{date}</p>
      </motion.div>

      {/* Stacked cards wrapper — height animates smoothly via transition */}
      <div
        className="relative w-full cursor-pointer transition-all duration-1000 ease-[cubic-bezier(0.075,0.82,0.165,1)]"
        style={{ height: isActive ? `${expandedHeight}px` : '12.5rem', overflow: isActive ? 'visible' : 'hidden' }}
        onClick={() => !isActive && setIsActive(true)}
      >
        {sessions.map((session, i) => (
          <div
            key={i}
            className={[
              'absolute right-0 left-0',
              'flex flex-row items-start gap-4',
              'h-36 rounded-2xl px-4 sm:px-5 pt-4 pb-3 border border-white/[0.07] backdrop-blur-xl',
              'transition-all duration-1000 ease-[cubic-bezier(0.075,0.82,0.165,1)]',
              'hover:border-white/15 hover:bg-white/[0.06]',
              isActive ? EXPANDED_OFFSETS[i] : COLLAPSED_OFFSETS[i],
            ].join(' ')}
            style={{ background: 'rgba(255,255,255,0.04)', zIndex: sessions.length - i }}
          >
            {/* Time — pinned to top */}
            <span className="shrink-0 font-outfit font-black text-white text-lg sm:text-2xl tabular-nums w-14 sm:w-16 text-right leading-none pt-0.5">
              {session.time}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base sm:text-lg leading-snug mb-1 line-clamp-2">
                {session.title}
              </p>
              <p className="text-white/55 text-sm sm:text-base truncate">{session.speaker}</p>
              <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: session.color, opacity: 0.75 }}>{session.role}</p>
            </div>

            {/* Speaker photo */}
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden"
              style={{ border: `1px solid ${session.color}30` }}>
              <img
                src={session.img}
                alt={session.speaker}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
          </div>
        ))}

        {/* Collapse button */}
        <div
          className={[
            'absolute right-0 transition-all duration-300 ease-in-out',
            isActive
              ? 'pointer-events-auto visible opacity-100'
              : 'pointer-events-none invisible opacity-0',
          ].join(' ')}
          style={{ top: `${expandedHeight - 32}px` }}
          onClick={(e) => { e.stopPropagation(); setIsActive(false); }}
        >
          <button className="text-[11px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-[0.22em] font-medium">
            {collapseLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ProgramPage() {
  const { t, dir, lang } = useLang();
  const isRtl = dir === 'rtl';
  
  const scheduleData = dict[lang].schedule;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
    <section className="min-h-screen bg-[#030712] relative overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.03) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)',
      }} />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.06) 0%, transparent 70%)' }} />

      {/* ── Hero — full screen, title centered ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Sparkles behind title */}
        <SparklesCore
          className="absolute inset-0 w-full h-full"
          background="transparent"
          particleColor="#818cf8"
          particleDensity={60}
          minSize={0.4}
          maxSize={1.2}
          speed={1.5}
        />
          <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
            <motion.span className="block text-white"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              {t('program.titleA')}
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              {t('program.titleB')}
            </motion.span>
          </h1>

          <motion.p
            className="text-white/40 max-w-md mx-auto text-base leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}>
            {t('program.lead')}
          </motion.p>

          {/* Tap hint */}
          <motion.p
            className="mt-6 text-[11px] text-white/25 uppercase tracking-[0.22em]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}>
            {t('program.expandHint')}
          </motion.p>
      </div>

      {/* ── Program cards ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <DayStack
            day={0}
            sessions={scheduleData.dayOne}
            label={scheduleData.dayOneLabel}
            date={scheduleData.dayOneDate}
            collapseLabel={scheduleData.collapse}
          />
          <DayStack
            day={1}
            sessions={scheduleData.dayTwo}
            label={scheduleData.dayTwoLabel}
            date={scheduleData.dayTwoDate}
            collapseLabel={scheduleData.collapse}
          />
        </div>
      </div>{/* end program cards */}

    </section>

    {/* GalleryRegisterHero MUST live outside the overflow-x-hidden section —
        any overflow:hidden ancestor breaks position:sticky */}
    <GalleryRegisterHero />

    </motion.div>
  );
}
