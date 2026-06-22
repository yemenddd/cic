'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';
import { dict } from '@/lib/dictionary';
import dynamic from 'next/dynamic';

const SparklesCore = dynamic(() => import('@/components/ui/sparkles').then(m => ({ default: m.SparklesCore })), { ssr: false });

type Session = {
  readonly time: string;
  readonly title: string;
  readonly speaker: string;
  readonly role: string;
  readonly img: string;
  readonly color: string;
};

const COLLAPSED_OFFSETS = [
  'top-6',
  'top-[calc(1.5rem+0.6rem)]',
  'top-[calc(1.5rem+1.2rem)]',
  'top-[calc(1.5rem+1.8rem)]',
];

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
  const expandedHeight = sessions.length * 144 + (sessions.length - 1) * 16 + 24 + 40;

  return (
    <div className="flex flex-col">
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: day * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-outfit font-bold mb-2"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: 'var(--text-primary)' }}>
          {label}
        </h2>
        <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{date}</p>
      </motion.div>

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
              'h-36 rounded-2xl px-4 sm:px-5 pt-4 pb-3 backdrop-blur-xl',
              'transition-all duration-1000 ease-[cubic-bezier(0.075,0.82,0.165,1)]',
              isActive ? EXPANDED_OFFSETS[i] : COLLAPSED_OFFSETS[i],
            ].join(' ')}
            style={{
              background: 'var(--mat-liquid-bg)',
              border: '1px solid var(--mat-liquid-border)',
              boxShadow: 'var(--mat-liquid-shadow)',
              zIndex: sessions.length - i,
            }}
          >
            <span className="shrink-0 font-outfit font-black text-lg sm:text-2xl tabular-nums w-14 sm:w-16 text-right leading-none pt-0.5"
              style={{ color: 'var(--text-primary)' }}>
              {session.time}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base sm:text-lg leading-snug mb-1 line-clamp-2"
                style={{ color: 'var(--text-primary)' }}>
                {session.title}
              </p>
              <p className="text-sm sm:text-base truncate" style={{ color: 'var(--text-secondary)' }}>
                {session.speaker}
              </p>
              <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: session.color, opacity: 0.85 }}>
                {session.role}
              </p>
            </div>

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

        <div
          className={[
            'absolute right-0 transition-all duration-300 ease-in-out',
            isActive ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0',
          ].join(' ')}
          style={{ top: `${expandedHeight - 32}px` }}
          onClick={(e) => { e.stopPropagation(); setIsActive(false); }}
        >
          <button
            className="text-[11px] uppercase tracking-[0.22em] font-medium transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isRtl = dir === 'rtl';

  const scheduleData = dict[lang].schedule;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
    <section className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg-base)' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(var(--mat-liquid-border) 1px,transparent 1px),linear-gradient(to right,var(--mat-liquid-border) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black, transparent)',
      }} />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.06) 0%, transparent 70%)' }} />

      {/* ── Hero ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Sparkles — dark mode only */}
        {!isLight && (
          <SparklesCore
            className="absolute inset-0 w-full h-full"
            background="transparent"
            particleColor="#818cf8"
            particleDensity={60}
            minSize={0.4}
            maxSize={1.2}
            speed={1.5}
          />
        )}

        <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-6 relative z-10"
          style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)' }}>
          <motion.span
            className="block"
            style={{ color: 'var(--text-primary)' }}
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
          className="max-w-md mx-auto text-base leading-relaxed relative z-10"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}>
          {t('program.lead')}
        </motion.p>
      </div>

      {/* ── Program cards ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
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
      </div>
    </section>
    </motion.div>
  );
}
