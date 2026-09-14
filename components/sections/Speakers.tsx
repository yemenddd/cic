'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import type { Speaker as DbSpeaker } from '@/lib/db/queries';

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

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.55, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.65, delay, ease: EASE },
});

function SpeakerCard({ speaker, index }: { speaker: Speaker; index: number }) {
  const { t } = useLang();
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div {...inView(index * 0.07)}>
      <div
        className="relative cursor-pointer select-none h-[200px] md:h-[260px]"
        style={{ perspective: '1200px' }}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
        onClick={() => setFlipped(v => !v)}
      >
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
            <div className="absolute bottom-0 inset-x-0 p-3">
              <h3 className="font-outfit font-bold text-[13px] leading-snug" style={{ color: '#ffffff' }}>{speaker.name}</h3>
              <p className="text-[11px] leading-snug mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.70)' }}>{speaker.role}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{speaker.org}</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl p-4 flex flex-col overflow-hidden"
            style={{
              backfaceVisibility:       'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform:                'rotateY(180deg)',
              background:               'rgba(12,12,16,0.92)',
              backdropFilter:           'blur(40px) saturate(160%)',
              WebkitBackdropFilter:     'blur(40px) saturate(160%)',
              border:                   `1px solid ${speaker.color.replace('0.85', '0.22')}`,
              boxShadow:                'none',
            }}
          >
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: speaker.color.replace('0.85', '0.25') }}
            />
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.2em] mb-2 relative z-10" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {t('speakers.talkLabel')}
            </p>
            <h4 className="font-outfit font-bold text-[13.5px] leading-snug mb-2 relative z-10" style={{ color: '#ffffff' }}>{speaker.topic}</h4>
            <p className="text-[11.5px] leading-relaxed flex-1 line-clamp-3 relative z-10" style={{ color: 'rgba(255,255,255,0.65)' }}>{speaker.bio}</p>
            <div
              className="mt-4 pt-3 flex items-center justify-between relative z-10"
              style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: '#ffffff' }}>{speaker.name}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{speaker.org}</p>
              </div>
              <ArrowUpRight size={16} style={{ color: 'rgba(255,255,255,0.40)' }} />
            </div>
          </div>

        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Speakers({ data }: { data?: DbSpeaker[] }) {
  const { t, tx, lang, dir } = useLang();

  const speakers: Speaker[] = data?.length
    ? data.map((s, i) => ({
        name:  s.name?.[lang] || s.name?.ar || '',
        role:  s.role?.[lang] || s.role?.ar || '',
        org:   s.organization?.[lang] || s.organization?.ar || '',
        topic: s.topic?.[lang] || s.topic?.ar || '',
        bio:   s.bio?.[lang] || s.bio?.ar || '',
        color:    speakerAssets[i]?.color    || 'rgba(255,255,255,0.5)',
        initials: speakerAssets[i]?.initials || '',
        image:    s.photoUrl || speakerAssets[i]?.image || '',
      }))
    : (tx<Omit<Speaker, 'color' | 'initials' | 'image'>[]>('speakers.list') || []).map((s, i) => ({
        ...s,
        color:    speakerAssets[i]?.color    || 'rgba(255,255,255,0.5)',
        initials: speakerAssets[i]?.initials || '',
        image:    speakerAssets[i]?.image    || '',
      }));

  return (
    <div id="speakers" className="relative" style={{ background: 'var(--bg-base)' }}>

      {/* Background decorations */}
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

      <div className="max-w-7xl mx-auto px-6 w-full py-14 md:py-24 relative z-10">
        <div className={`flex flex-col-reverse items-center gap-6 lg:gap-10 w-full ${dir === 'rtl' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>

          {/* Cards grid */}
          <div className="w-full lg:w-[58%] shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {speakers.map((speaker, i) => (
                <SpeakerCard key={speaker.name} speaker={speaker} index={i} />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={`w-full lg:flex-1 flex flex-col items-center justify-center mb-4 lg:mb-0 ${dir === 'rtl' ? 'lg:items-start' : 'lg:items-end'}`} dir={dir}>
            <h2 className={`font-outfit font-bold tracking-tight leading-[1] text-center ${dir === 'rtl' ? 'lg:text-right' : 'lg:text-left'}`}>
              <motion.span
                className="block"
                style={{
                  fontSize:             'clamp(2.8rem, 7vw, 8rem)',
                  background:           'var(--metallic-grad)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  backgroundClip:       'text',
                  paddingTop:           '0.15em',
                  paddingBottom:        '0.15em',
                  display:              'block',
                }}
                {...inViewWord(0)}
              >
                {t('speakers.titleA')}
              </motion.span>
              <motion.span
                className="block gradient-text pt-[0.1em] pb-[0.35em] leading-[1.1]"
                style={{ fontSize: 'clamp(2rem, 4vw, 5rem)' }}
                {...inViewWord(0.1)}
              >
                {t('speakers.titleB')}
              </motion.span>
            </h2>
          </div>

        </div>
      </div>
    </div>
  );
}
