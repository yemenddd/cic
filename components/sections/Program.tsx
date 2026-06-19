'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';

type StreamText = { title: string; description: string; points: string[] };

const R = '28px';

// Each card squares its ONE inner corner; the center circle creates the concave illusion
const meta = [
  { number: '01', icon: '/images/programm/الاختراع.png',  borderRadius: `${R} ${R} 0   ${R}` }, // top-left:    inner=BR
  { number: '02', icon: '/images/programm/البحث.png',     borderRadius: `${R} ${R} ${R} 0`   }, // top-right:   inner=BL
  { number: '03', icon: '/images/programm/التدريب.png',   borderRadius: `${R} 0   ${R} ${R}` }, // bottom-left: inner=TR
  { number: '04', icon: '/images/programm/المعرض.png',    borderRadius: `0   ${R} ${R} ${R}` }, // bottom-right:inner=TL
];

const EASE = [0.16, 1, 0.3, 1] as const;

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.15 },
  transition:  { duration: 0.55, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.15 },
  transition:  { duration: 0.65, delay, ease: EASE },
});

export default function Program() {
  const { t, tx } = useLang();
  const streamText = tx<StreamText[]>('program.streams');
  const streams = meta.map((m, i) => ({ key: String(i), ...m, ...streamText[i] }));

  return (
    <section
      id="program"
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-elevated)' }}
    >
      <div className="max-w-7xl mx-auto px-6 w-full">

        {/* ── Two-column: title left, cards right ── */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16" dir="ltr">

          {/* LEFT — image + title */}
          <div className="w-full lg:shrink-0 lg:w-auto flex flex-col items-center text-center" dir="rtl">
            {/* Floating main image */}
            <motion.div className="mb-4 shrink-0" {...inView(0)}>
              <motion.img
                src="/images/programm/main.png"
                alt="Program"
                className="w-56 h-56 md:w-72 md:h-72 object-contain"
                animate={{ y: [0, -18, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            <h2 className="font-outfit font-bold tracking-tight leading-[1] text-center">
              <motion.span
                className="block"
                style={{
                  fontSize:      'clamp(2.6rem, 5.5vw, 5rem)',
                  color:         'var(--text-primary)',
                  paddingBottom: '0.05em',
                }}
                {...inViewWord(0.08)}
              >
                {t('program.titleA')}
              </motion.span>
              <motion.span
                className="block gradient-text py-[0.15em] leading-[1.1]"
                style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.2rem)' }}
                {...inViewWord(0.16)}
              >
                {t('program.titleB')}
              </motion.span>
            </h2>
            <motion.p
              className="mt-5 text-[15px] leading-relaxed text-center max-w-xs"
              style={{ color: 'var(--text-secondary)' }}
              {...inView(0.22)}
            >
              {t('program.lead')}
            </motion.p>
          </div>

          {/* RIGHT — 2×2 cards grid */}
          <div className="relative w-full lg:flex-1 grid grid-cols-2 auto-rows-fr gap-4">

            {/* Center circle — creates the concave corner illusion */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-10"
              style={{ width: 56, height: 56, background: 'var(--bg-elevated)' }}
            />

            {streams.map((stream, i) => (
              <motion.article
                key={stream.key}
                className="flex flex-col items-center text-center p-7 h-full"
                dir="rtl"
                style={{
                  background:   'var(--bg-base)',
                  borderRadius: stream.borderRadius,
                }}
                {...inView(0.06 + i * 0.08)}
                whileHover={{ y: -4, transition: { duration: 0.28, ease: EASE } }}
              >
                <img
                  src={stream.icon}
                  alt={stream.title}
                  className="w-24 h-24 object-contain mb-5 shrink-0"
                />
                <h3
                  className="font-outfit font-bold text-xl md:text-2xl tracking-tight mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {stream.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {stream.description}
                </p>
              </motion.article>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
