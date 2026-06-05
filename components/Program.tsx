'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

type StreamText = { title: string; description: string; points: string[] };

const meta = [
  { number: '01', color: '#0078D4', rotation: 'lg:rotate-6' },
  { number: '02', color: '#8764B8', rotation: 'rotate-0' },
  { number: '03', color: '#038387', rotation: 'lg:-rotate-6' },
  { number: '04', color: '#C19C00', rotation: 'rotate-0' },
];

export default function Program() {
  const { t, tx } = useLang();
  const streamText = tx<StreamText[]>('program.streams');
  const streams = meta.map((m, i) => ({ key: String(i), ...m, ...streamText[i] }));

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setCurrentP(v));

  const reveal = (threshold: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  });

  const revealWord = (threshold: number) => ({
    initial: { opacity: 0, y: 48 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section
      ref={sectionRef}
      id="program"
      style={{ background: '#030712', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex flex-col lg:flex-row justify-between px-6 lg:px-16 max-w-screen-xl mx-auto relative">

        {/* ── LEFT: sticky stacking cards ── */}
        <div className="grid gap-2 w-full lg:w-auto relative z-10 pt-28 lg:pt-0">
          {streams.map((stream, i) => {
            // text finishes at ~0.32; distribute 4 cards across 0.36 → 0.84
            const cardThreshold = 0.36 + i * 0.16;
            return (
            <figure
              key={stream.key}
              className="sticky top-0 h-[85vh] lg:h-screen flex items-end lg:items-center lg:grid lg:place-content-center pb-8 lg:pb-0"
            >
              <motion.article
                className={`w-full max-w-[30rem] mx-auto lg:w-[30rem] rounded-2xl overflow-hidden ${stream.rotation}`}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: currentP >= cardThreshold ? 1 : 0, y: currentP >= cardThreshold ? 0 : 40 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="h-[3px] w-full" style={{ background: stream.color }} />
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="font-mono text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: stream.color }}
                    >
                      {stream.number} / 04
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
                  </div>
                  <h3
                    className="font-outfit font-bold text-2xl md:text-3xl tracking-tight mb-3"
                    style={{ color: '#1a1a1a' }}
                  >
                    {stream.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#5a5a5a' }}>
                    {stream.description}
                  </p>
                  <div className="space-y-2.5">
                    {stream.points.map((point) => (
                      <div key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 size={15} className="shrink-0 mt-[2px]" style={{ color: stream.color }} />
                        <span className="text-[13px] leading-snug" style={{ color: '#3a3a3a' }}>
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

        {/* ── RIGHT: sticky heading — scroll-reveal ── */}
        <div className="order-first lg:order-none sticky top-0 z-20 pt-32 pb-6 lg:py-0 lg:h-screen flex flex-col justify-start lg:justify-center items-center lg:items-start text-center lg:text-right lg:pl-10 bg-[#030712]/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-white/5 lg:border-none">
          <div>

            {/* Headline */}
            <h2
              className="font-outfit font-bold leading-[0.9] tracking-tight mb-2 lg:mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
            >
              <motion.span className="block text-white" {...revealWord(0.06)}>
                {t('program.titleA')}
              </motion.span>
              <motion.span className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent" {...revealWord(0.11)}>
                {t('program.titleB')}
              </motion.span>
            </h2>

            {/* Description (hidden on mobile) */}
            <motion.p
              className="hidden lg:block text-[15px] leading-relaxed max-w-[280px] text-white/50"
              {...reveal(0.16)}
            >
              {t('program.lead')}
            </motion.p>

            {/* Stream indicators (hidden on mobile) */}
            <div className="hidden lg:flex flex-col gap-3 mt-10">
              {streams.map((s, i) => (
                <motion.div
                  key={s.key}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentP >= 0.20 + i * 0.04 ? 1 : 0, y: currentP >= 0.20 + i * 0.04 ? 0 : 20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-[3px] h-4 rounded-full" style={{ background: s.color }} />
                  <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
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
