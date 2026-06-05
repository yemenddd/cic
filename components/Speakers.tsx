'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';

type Speaker = {
  name: string;
  role: string;
  org: string;
  topic: string;
  bio: string;
  color: string;
  initials: string;
  image: string;
};

const speakerAssets = [
  { color: '#0078D4', initials: 'AB', image: '/images/speakers/abdulrahman.jpg' },
  { color: '#038387', initials: 'OA', image: '/images/speakers/osama.jpg' },
  { color: '#8764B8', initials: 'AS', image: '/images/speakers/ammar.jpg' },
  { color: '#C19C00', initials: 'MA', image: '/images/speakers/mohammed.jpg' },
  { color: '#107C10', initials: 'AA', image: '/images/speakers/abdullah.jpg' },
  { color: '#C43E1C', initials: 'AS', image: '/images/speakers/ali.jpg' },
];

function SpeakerCard({ speaker, index, currentP }: { speaker: Speaker; index: number; currentP: number }) {
  const { t } = useLang();
  const [flipped, setFlipped] = useState(false);
  const threshold = 0.30 + index * 0.06;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="relative cursor-pointer select-none"
        style={{ height: '260px', perspective: '1200px' }}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        onClick={() => setFlipped((v) => !v)}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ── FRONT ── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Full-bleed photo */}
            <img
              src={speaker.image}
              alt={speaker.name}
              className="w-full h-full object-cover object-top"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {/* Color accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: speaker.color }} />
            {/* Text overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-outfit font-bold text-[13px] text-white leading-snug">{speaker.name}</h3>
              <p className="text-[11px] text-white/65 leading-snug mt-0.5 line-clamp-1">{speaker.role}</p>
              <p className="text-[10px] text-white/40 mt-0.5 truncate">{speaker.org}</p>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            className="absolute inset-0 rounded-2xl p-4 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: speaker.color,
            }}
          >
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/55 mb-2">
              {t('speakers.talkLabel')}
            </p>
            <h4 className="font-outfit font-bold text-base text-white leading-snug mb-2">{speaker.topic}</h4>
            <p className="text-xs text-white/80 leading-relaxed flex-1 line-clamp-3">{speaker.bio}</p>
            <div
              className="mt-5 pt-4 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.20)' }}
            >
              <div>
                <p className="text-sm font-semibold text-white">{speaker.name}</p>
                <p className="text-xs text-white/55 mt-0.5">{speaker.org}</p>
              </div>
              <ArrowUpRight size={18} className="text-white/50" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Speakers() {
  const { t, tx } = useLang();

  const rawSpeakers = tx<Omit<Speaker, 'color' | 'initials' | 'image'>[]>('speakers.list') || [];
  const speakers: Speaker[] = rawSpeakers.map((s, i) => ({
    ...s,
    color: speakerAssets[i]?.color || '#000',
    initials: speakerAssets[i]?.initials || '',
    image: speakerAssets[i]?.image || '',
  }));

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setCurrentP(v));

  const revealWord = (threshold: number) => ({
    initial: { opacity: 0, y: 48 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div
      ref={sectionRef}
      id="speakers"
      className="relative h-[200vh]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-6 w-full py-8">

          {/* ── Side-by-side: photos left, title right ── */}
          <div className="flex items-center gap-10 w-full" dir="ltr">

            {/* LEFT: Cards grid */}
            <div className="w-[58%] shrink-0">
              <div className="grid grid-cols-3 gap-3">
                {speakers.map((speaker, i) => (
                  <SpeakerCard key={speaker.name} speaker={speaker} index={i} currentP={currentP} />
                ))}
              </div>
            </div>

            {/* RIGHT: Title vertically centered */}
            <div className="flex-1 flex items-center justify-center" dir="rtl">
              <h2
                className="font-outfit font-bold tracking-tight leading-[0.9] text-white text-right"
              >
                <motion.span className="block" style={{ fontSize: 'clamp(4rem, 7vw, 8rem)' }} {...revealWord(0.10)}>
                  {t('speakers.titleA')}
                </motion.span>
                <motion.span className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent" style={{ fontSize: 'clamp(2.4rem, 4vw, 5rem)' }} {...revealWord(0.17)}>
                  {t('speakers.titleB')}
                </motion.span>
              </h2>
            </div>

          </div>


        </div>
      </div>
    </div>
  );
}
