'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

type StreamText = { title: string; description: string; points: string[] };

const meta = [
  { number: '01', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.20)',   rotation: 'lg:rotate-6'  },
  { number: '02', color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.20)', rotation: 'rotate-0'     },
  { number: '03', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.20)', rotation: 'lg:-rotate-6' },
  { number: '04', color: '#10b981', glowColor: 'rgba(16,185,129,0.20)', rotation: 'rotate-0'     },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Program() {
  const { t, tx } = useLang();
  const streamText = tx<StreamText[]>('program.streams');
  const streams = meta.map((m, i) => ({ key: String(i), ...m, ...streamText[i] }));

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', v => setCurrentP(v));

  const reveal = (t: number) => ({
    initial:    { opacity: 0, y: 28 },
    animate:    { opacity: currentP >= t ? 1 : 0, y: currentP >= t ? 0 : 28 },
    transition: { duration: 0.5, ease: EASE },
  });

  const revealWord = (t: number) => ({
    initial:    { opacity: 0, y: 48 },
    animate:    { opacity: currentP >= t ? 1 : 0, y: currentP >= t ? 0 : 48 },
    transition: { duration: 0.6, ease: EASE },
  });

  return (
    <section
      ref={sectionRef}
      id="program"
      style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="flex flex-col lg:flex-row justify-between px-6 lg:px-16 max-w-screen-xl mx-auto relative">

        {/* ── Stacking cards ── */}
        <div className="grid gap-2 w-full lg:w-auto relative z-10 pt-28 lg:pt-0">
          {streams.map((stream, i) => {
            const cardThreshold = 0.36 + i * 0.16;
            return (
              <figure
                key={stream.key}
                className="sticky top-0 h-[85vh] lg:h-screen flex items-end lg:items-center lg:grid lg:place-content-center pb-8 lg:pb-0"
              >
                <motion.article
                  className={`w-full max-w-[30rem] mx-auto lg:w-[30rem] rounded-2xl overflow-hidden ${stream.rotation}`}
                  style={{
                    background:  'var(--glass-bg)',
                    backdropFilter: 'blur(32px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                    border:      `1px solid ${stream.color}22`,
                    boxShadow:   `inset 0 1px 0 var(--glass-shine), 0 24px 64px rgba(0,0,0,0.55), 0 0 60px ${stream.glowColor}`,
                  }}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: currentP >= cardThreshold ? 1 : 0, y: currentP >= cardThreshold ? 0 : 40 }}
                  transition={{ duration: 1.4, ease: EASE }}
                >
                  <div className="h-[2px] w-full" style={{ background: stream.color }} />
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-5">
                      <span
                        className="font-mono text-[10.5px] font-bold uppercase tracking-widest"
                        style={{ color: stream.color }}
                      >
                        {stream.number} / 04
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                    </div>
                    <h3
                      className="font-outfit font-bold text-2xl md:text-3xl tracking-tight mb-3 text-white"
                    >
                      {stream.title}
                    </h3>
                    <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                      {stream.description}
                    </p>
                    <div className="space-y-2.5">
                      {stream.points.map(point => (
                        <div key={point} className="flex items-start gap-2.5">
                          <CheckCircle2 size={14} className="shrink-0 mt-[2px]" style={{ color: stream.color }} />
                          <span className="text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.article>
              </figure>
            );
          })}
        </div>

        {/* ── Sticky heading ── */}
        <div
          className="order-first lg:order-none sticky top-0 z-20 pt-32 pb-6 lg:py-0 lg:h-screen flex flex-col justify-start lg:justify-center items-center lg:items-start text-center lg:text-right lg:pl-10 border-b lg:border-none overflow-hidden"
          style={{
            background:    'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderColor:   'var(--border-subtle)',
          }}
        >
          <div>
            <h2
              className="font-outfit font-bold leading-[0.9] tracking-tight mb-2 lg:mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
            >
              <motion.span className="block text-white" {...revealWord(0.06)}>
                {t('program.titleA')}
              </motion.span>
              <motion.span className="block gradient-text py-[0.2em] leading-[1.1]" {...revealWord(0.11)}>
                {t('program.titleB')}
              </motion.span>
            </h2>

            <motion.p
              className="hidden lg:block text-[14.5px] leading-relaxed max-w-[280px]"
              style={{ color: 'var(--text-tertiary)' }}
              {...reveal(0.16)}
            >
              {t('program.lead')}
            </motion.p>

            <div className="hidden lg:flex flex-col gap-3 mt-10">
              {streams.map((s, i) => (
                <motion.div
                  key={s.key}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentP >= 0.20 + i * 0.04 ? 1 : 0, y: currentP >= 0.20 + i * 0.04 ? 0 : 20 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <div className="w-[2px] h-4 rounded-full" style={{ background: s.color }} />
                  <span className="text-[11.5px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--text-tertiary)' }}>
                    {s.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
