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
  { color: 'rgba(6,182,212,0.85)',   initials: 'AB', image: '/images/speakers/abdulrahman.jpg' },
  { color: 'rgba(59,130,246,0.85)',  initials: 'OA', image: '/images/speakers/osama.jpg' },
  { color: 'rgba(139,92,246,0.85)',  initials: 'AS', image: '/images/speakers/ammar.jpg' },
  { color: 'rgba(16,185,129,0.85)',  initials: 'MA', image: '/images/speakers/mohammed.jpg' },
  { color: 'rgba(245,158,11,0.85)',  initials: 'AA', image: '/images/speakers/abdullah.jpg' },
  { color: 'rgba(239,68,68,0.85)',   initials: 'AS', image: '/images/speakers/ali.jpg' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function SpeakerCard({ speaker, index, currentP }: { speaker: Speaker; index: number; currentP: number }) {
  const { t } = useLang();
  const [flipped, setFlipped] = useState(false);
  const threshold = 0.30 + index * 0.055;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div
        className="relative cursor-pointer select-none h-[160px] md:h-[260px]"
        style={{ perspective: '1200px' }}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        onClick={() => setFlipped(v => !v)}
      >
        {/* Spatial glow on hover — per-card accent color */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 0 1px ${speaker.color.replace('0.85', '0.25')}` }}
        />
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >

          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <img
              src={speaker.image}
              alt={speaker.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
            {/* Accent line */}
            <div
              className="absolute top-0 inset-x-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${speaker.color}, transparent 80%)` }}
            />
            {/* Name overlay */}
            <div className="absolute bottom-0 inset-x-0 p-3">
              <h3 className="font-outfit font-bold text-[13px] text-white leading-snug">{speaker.name}</h3>
              <p className="text-[11px] leading-snug mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{speaker.role}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{speaker.org}</p>
            </div>
          </div>

          {/* Back — Black Glass with spatial depth */}
          <div
            className="absolute inset-0 rounded-2xl p-4 flex flex-col overflow-hidden"
            style={{
              backfaceVisibility:       'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform:                'rotateY(180deg)',
              background:               'rgba(8, 8, 12, 0.92)',
              backdropFilter:           'blur(40px) saturate(160%)',
              WebkitBackdropFilter:     'blur(40px) saturate(160%)',
              border:                   `1px solid ${speaker.color.replace('0.85', '0.22')}`,
              boxShadow:                `0 8px 40px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {/* Subtle glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: speaker.color.replace('0.85', '0.25') }}
            />
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.2em] mb-2 relative z-10" style={{ color: 'var(--text-tertiary)' }}>
              {t('speakers.talkLabel')}
            </p>
            <h4 className="font-outfit font-bold text-[13.5px] text-white leading-snug mb-2 relative z-10">{speaker.topic}</h4>
            <p className="text-[11.5px] leading-relaxed flex-1 line-clamp-3 relative z-10" style={{ color: 'var(--text-secondary)' }}>{speaker.bio}</p>
            <div
              className="mt-4 pt-3 flex items-center justify-between relative z-10"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <div>
                <p className="text-[12.5px] font-semibold text-white">{speaker.name}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{speaker.org}</p>
              </div>
              <ArrowUpRight size={16} style={{ color: 'var(--text-tertiary)' }} />
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
    color:    speakerAssets[i]?.color    || 'rgba(255,255,255,0.5)',
    initials: speakerAssets[i]?.initials || '',
    image:    speakerAssets[i]?.image    || '',
  }));

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', v => setCurrentP(v));

  const revealWord = (threshold: number) => ({
    initial:    { opacity: 0, y: 48 },
    animate:    { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
    transition: { duration: 0.6, ease: EASE },
  });

  return (
    <div
      ref={sectionRef}
      id="speakers"
      className="relative h-[200vh]"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center" style={{ background: 'var(--bg-base)' }}>

        {/* Background decorations — overflow clipped here so content stays unclipped */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 65%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full py-8 relative z-10">

          <div className="flex flex-col-reverse lg:flex-row items-center gap-6 lg:gap-10 w-full" dir="ltr">

            {/* Cards grid */}
            <div className="w-full lg:w-[58%] shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {speakers.map((speaker, i) => (
                  <SpeakerCard key={speaker.name} speaker={speaker} index={i} currentP={currentP} />
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="w-full lg:flex-1 flex flex-col items-center justify-center lg:items-end mb-4 lg:mb-0" dir="rtl">

              <h2 className="font-outfit font-bold tracking-tight leading-[1] text-center lg:text-right">
                <motion.span
                  className="block"
                  style={{
                    fontSize: 'clamp(2.8rem, 7vw, 8rem)',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #A2A2A6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    paddingTop: '0.15em',
                    paddingBottom: '0.15em',
                    display: 'block',
                  }}
                  {...revealWord(0.10)}
                >
                  {t('speakers.titleA')}
                </motion.span>
                <motion.span
                  className="block gradient-text pt-[0.1em] pb-[0.35em] leading-[1.1]"
                  style={{ fontSize: 'clamp(2rem, 4vw, 5rem)' }}
                  {...revealWord(0.17)}
                >
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
