'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { SparklesCore } from '@/components/ui/sparkles';

/* ─── Session card data ─── */
interface Session {
  time: string;
  title: string;
  speaker: string;
  role: string;
  img: string;
  color: string;
}

const DAY_ONE: Session[] = [
  { time: '09:00', title: 'الافتتاح الرسمي وكلمة رئيس المؤتمر', speaker: 'فريق قيادة المؤتمر', role: 'افتتاح', img: '/images/attends/1.jpg', color: '#67e8f9' },
  { time: '10:30', title: 'الأنظمة المستقلة في التعافي من النزاعات', speaker: 'د. عبدالرحمن باهرمز', role: 'مهندس روبوتات — ETH Zurich', img: '/images/speakers/abdulrahman.jpg', color: '#60a5fa' },
  { time: '12:00', title: 'الذكاء الاصطناعي المسؤول للدول النامية', speaker: 'م. أسامة عادل', role: 'باحث — جامعة أكسفورد', img: '/images/speakers/osama.jpg', color: '#818cf8' },
  { time: '14:30', title: 'ورشة الابتكار الهندسي التطبيقي', speaker: 'فريق مسار الابتكار', role: 'جلسة تفاعلية', img: '/images/attends/3.jpg', color: '#a78bfa' },
];

const DAY_TWO: Session[] = [
  { time: '09:30', title: 'بناء الشركات الناشئة في الدول الهشة', speaker: 'م. عمار صالح', role: 'مؤسس — تيك يمن', img: '/images/speakers/ammar.jpg', color: '#67e8f9' },
  { time: '11:00', title: 'الطاقة المتجددة كعائد للسلام', speaker: 'م. عبدالله العمراني', role: 'رائد طاقة — سولار أرابيا', img: '/images/speakers/abdullah.jpg', color: '#34d399' },
  { time: '13:00', title: 'التنمية القائمة على البيانات في اليمن', speaker: 'د. محمد علي أوغلو', role: 'كبير علماء البيانات — UNDP', img: '/images/speakers/mohammed.jpg', color: '#f59e0b' },
  { time: '15:30', title: 'الختام وتكريم المشاركين', speaker: 'فريق المؤتمر', role: 'حفل ختامي', img: '/images/attends/2.jpg', color: '#a78bfa' },
];

const COLLAPSED_OFFSETS = [
  'top-0',
  'top-[calc(0.5rem+0.5rem)]',
  'top-[calc(0.5rem+1rem)]',
  'top-[calc(0.5rem+1.5rem)]',
];

const EXPANDED_OFFSETS = [
  'top-0',
  'top-[calc(120px+1rem)]',
  'top-[calc(240px+2rem)]',
  'top-[calc(360px+3rem)]',
];

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
      <div
        className="relative cursor-pointer"
        style={{ height: isActive ? sessions.length * 120 + (sessions.length - 1) * 16 + 48 : 200 }}
        onClick={() => !isActive && setIsActive(true)}
      >
        {sessions.map((session, i) => (
          <motion.div
            key={i}
            className={`absolute right-0 left-0 transition-all duration-700 ease-[cubic-bezier(0.075,0.82,0.165,1)] ${
              isActive ? EXPANDED_OFFSETS[i] : COLLAPSED_OFFSETS[i]
            }`}
            style={{ zIndex: sessions.length - i }}
          >
            <div
              className="flex items-start gap-4 rounded-2xl p-4 border border-white/[0.07] backdrop-blur-xl transition-colors duration-300 hover:border-white/15"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {/* Time */}
              <span className="shrink-0 font-outfit font-black text-white text-2xl tabular-nums w-16 text-center">
                {session.time}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg leading-snug line-clamp-1 mb-1">
                  {session.title}
                </p>
                <p className="text-white/50 text-base truncate">{session.speaker}</p>
                <p className="text-sm truncate mt-0.5" style={{ color: session.color, opacity: 0.7 }}>{session.role}</p>
              </div>

              {/* Speaker photo */}
              <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden"
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
              className="absolute right-0 text-[12px] text-white/35 hover:text-white/60 transition-colors uppercase tracking-[0.2em] font-medium"
              style={{ top: sessions.length * 120 + (sessions.length - 1) * 16 + 8 }}
              onClick={(e) => { e.stopPropagation(); setIsActive(false); }}
            >
              طيّ القائمة ↑
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function ProgramPage() {
  const { t, dir } = useLang();
  const isRtl = dir === 'rtl';

  return (
    <section className="min-h-screen bg-[#030712] relative" dir={isRtl ? 'rtl' : 'ltr'}>

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
            sessions={DAY_ONE}
            label={isRtl ? 'اليوم الأول' : 'Day One'}
            date={isRtl ? 'الجمعة · ١٥ أغسطس ٢٠٢٦' : 'Friday · August 15, 2026'}
          />
          <DayStack
            day={1}
            sessions={DAY_TWO}
            label={isRtl ? 'اليوم الثاني' : 'Day Two'}
            date={isRtl ? 'السبت · ١٦ أغسطس ٢٠٢٦' : 'Saturday · August 16, 2026'}
          />
        </div>
      </div>{/* end program cards */}
    </section>
  );
}
