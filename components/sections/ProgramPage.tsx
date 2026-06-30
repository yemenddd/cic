'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { dict } from '@/lib/dictionary';

type Session = {
  readonly time: string;
  readonly title: string;
  readonly speaker: string;
  readonly role: string;
  readonly img: string;
  readonly color: string;
};

const CARD_H  = 144; // h-36 in px
const CARD_GAP = 16; // gap between expanded cards
const BASE_TOP = 24; // top-6 = 24px

// Collapsed: doubling offsets so cards peek behind each other
const COLLAPSED_TOPS = [0, 12, 24, 48].map(v => BASE_TOP + v);

// Expanded: evenly spaced
const expandedTop = (i: number) => BASE_TOP + i * (CARD_H + CARD_GAP);

const SPRING = { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.8 };

/* ─── Stacked day cards ─── */
function DayStack({ day, sessions, label, date, collapseLabel }: {
  day: number;
  sessions: readonly Session[];
  label: string;
  date: string;
  collapseLabel: string;
}) {
  const [isActive, setIsActive] = useState(false);

  const expandedH = BASE_TOP + sessions.length * CARD_H + (sessions.length - 1) * CARD_GAP + 44;
  const collapsedH = 232; // enough to show all peeking card edges

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

      {/* Container — height animates via spring */}
      <motion.div
        className="relative w-full cursor-pointer"
        animate={{ height: isActive ? expandedH : collapsedH }}
        transition={SPRING}
        style={{ overflow: 'hidden' }}
        onClick={() => !isActive && setIsActive(true)}
      >
        {sessions.map((session, i) => (
          <motion.div
            key={i}
            className="absolute right-0 left-0 flex flex-row items-start gap-4 h-36 rounded-2xl px-4 sm:px-5 pt-4 pb-3 backdrop-blur-xl"
            initial={{ top: COLLAPSED_TOPS[i] ?? BASE_TOP }}
            animate={{ top: isActive ? expandedTop(i) : (COLLAPSED_TOPS[i] ?? BASE_TOP) }}
            transition={{
              ...SPRING,
              delay: isActive
                ? i * 0.055          // expand: top card first
                : (sessions.length - 1 - i) * 0.04, // collapse: bottom card first
            }}
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
          </motion.div>
        ))}

        {/* Collapse button */}
        <motion.div
          className="absolute right-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0, top: expandedH - 36 }}
          transition={{ duration: 0.25, delay: isActive ? sessions.length * 0.055 + 0.15 : 0 }}
          style={{ pointerEvents: isActive ? 'auto' : 'none' }}
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
        </motion.div>
      </motion.div>
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
            className="block py-[0.2em] leading-[1.1]"
            style={{
              background:          'linear-gradient(to right, #4a98e8, #6c3ecc)',
              WebkitBackgroundClip:'text',
              backgroundClip:      'text',
              WebkitTextFillColor: 'transparent',
              color:               'transparent',
            }}
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
