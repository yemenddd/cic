'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { dict } from '@/lib/dictionary';
import { SparklesCore } from '@/components/ui/sparkles';

/* ─── Session card data ─── */
type Session = {
  time: string;
  title: string;
  speaker: string;
  role: string;
  img: string;
  color: string;
};

/* ─── Stacked day cards ─── */
function DayStack({ day, sessions, label, date }: { day: number; sessions: Session[]; label: string; date: string }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="flex flex-col" dir="rtl">
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

      {/* Stacked cards */}
      <motion.div
        layout
        className={`relative cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.075,0.82,0.165,1)] ${isActive ? 'flex flex-col gap-4 mb-10' : 'h-[200px]'}`}
        onClick={() => !isActive && setIsActive(true)}
      >
        {sessions.map((session, i) => (
          <motion.div
            layout
            key={i}
            className={`transition-all duration-700 ease-[cubic-bezier(0.075,0.82,0.165,1)] ${isActive ? 'relative w-full' : 'absolute right-0 left-0'}`}
            style={isActive ? { zIndex: sessions.length - i } : { top: `calc(${i * 0.5}rem + ${i * 0.5}rem)`, zIndex: sessions.length - i }}
          >
            <div
              className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5 border border-white/[0.07] backdrop-blur-xl transition-colors duration-300 hover:border-white/15"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {/* Top row on mobile (Time + Photo), just Time on desktop */}
              <div className="flex items-center justify-between sm:justify-start sm:w-auto w-full">
                <span className="shrink-0 font-outfit font-black text-white text-xl sm:text-2xl tabular-nums w-14 sm:w-16 rtl:text-right ltr:text-left sm:text-center">
                  {session.time}
                </span>
                
                {/* Mobile Speaker Photo */}
                <div className="sm:hidden shrink-0 w-12 h-12 rounded-full overflow-hidden"
                  style={{ border: `1px solid ${session.color}30` }}>
                  <img src={session.img} alt={session.speaker} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 mt-1 sm:mt-0">
                <p className="text-white font-semibold text-base sm:text-lg leading-snug mb-1">
                  {session.title}
                </p>
                <p className="text-white/50 text-sm sm:text-base">{session.speaker}</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: session.color, opacity: 0.7 }}>{session.role}</p>
              </div>

              {/* Desktop Speaker photo */}
              <div className="hidden sm:block shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden"
                style={{ border: `1px solid ${session.color}30` }}>
                <img src={session.img} alt={session.speaker} className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Collapse button */}
        <AnimatePresence>
          {isActive && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute -bottom-8 rtl:left-0 ltr:right-0 text-[12px] text-white/35 hover:text-white/60 transition-colors uppercase tracking-[0.2em] font-medium"
              onClick={(e) => { e.stopPropagation(); setIsActive(false); }}
            >
              {dict['ar'].schedule?.collapse || 'طيّ القائمة ↑'} {/* It will use the prop passed or fallback */}
            </motion.button>
          )}
        </AnimatePresence>
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
            {isRtl ? 'انقر على البطاقات للتوسيع' : 'Click cards to expand'}
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
          />
          <DayStack
            day={1}
            sessions={scheduleData.dayTwo}
            label={scheduleData.dayTwoLabel}
            date={scheduleData.dayTwoDate}
          />
        </div>
      </div>{/* end program cards */}
    </section>
  );
}
