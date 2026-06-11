'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const BG_VIDEO_ID = 'REGcpGlNvC8';
const FILM_VIDEO_ID = 'XMZ4htBi20s';

export default function CinematicBreak() {
  const { t } = useLang();
  const [videoOpen, setVideoOpen] = useState(false);
  const words = [t('cinematic.word1'), t('cinematic.word2'), t('cinematic.word3'), t('cinematic.word4')];

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const [maxP, setMaxP] = useState(0);
  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setCurrentP(v);
    setMaxP((prev) => (v > prev ? v : prev));
  });

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

  const wordThresholds = [0.10, 0.16, 0.22, 0.28];

  return (
    <>
      <section ref={sectionRef} className="relative h-[200vh] bg-black">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

          {/* ── Background video — muted, looping, cover ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <iframe
              title="CICT 2025 background reel"
              src={`https://www.youtube.com/embed/${BG_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${BG_VIDEO_ID}&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playsinline=1&iv_load_policy=3`}
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full"
              style={{ border: 'none' }}
            />
          </div>

          {/* ── 70% black layer over the running video ── */}
          <div className="absolute inset-0 bg-black/70" />

          {/* ── Content ── */}
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">

            {/* Eyebrow — brand logo */}
            <motion.div className="flex justify-center mb-7" {...reveal(0.05)}>
              <Image
                src="/images/logos/logo_text_horizonal.png"
                alt="CICT 2026"
                width={640}
                height={128}
                className="h-12 sm:h-20 lg:h-28 w-auto object-contain"
                priority
              />
            </motion.div>

            {/* Big animated headline */}
            <h2 className="font-outfit font-bold tracking-tight leading-[0.92] mb-12 drop-shadow-[0_2px_40px_rgba(0,0,0,0.6)]">
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  className="inline-block mr-[0.22em]"
                  style={{
                    fontSize: 'clamp(2.5rem, 8vw, 8rem)',
                    ...(i === words.length - 1 ? {
                      background: 'var(--gradient-text)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      paddingBottom: '0.25em',
                      lineHeight: '1.1',
                      display: 'inline-block',
                    } : { color: '#ffffff' }),
                  }}
                  {...revealWord(wordThresholds[i])}
                >
                  {word}
                </motion.span>
              ))}
            </h2>

            {/* Watch CTA — opens the film with sound */}
            <motion.button
              onClick={() => setVideoOpen(true)}
              {...reveal(0.36)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 pl-2 pr-6 rtl:pr-2 rtl:pl-6 py-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: '#3b82f6' }}
              >
                <Play size={16} fill="white" className="text-white ml-[2px]" />
              </span>
              <span className="font-outfit font-semibold text-[15px] text-white">
                {t('cinematic.watch')}
              </span>
            </motion.button>
          </div>

          {/* ── Scroll cue — hides once scrolling starts ── */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
            animate={{ opacity: maxP > 0.04 ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('cinematic.scroll')}</span>
            <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
              <motion.span
                className="w-1 h-1.5 rounded-full bg-white/50"
                animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Video Modal — full film with sound ── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            key="video-modal"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setVideoOpen(false)}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />
            <button
              aria-label="Close video"
              onClick={() => setVideoOpen(false)}
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)')}
            >
              <X size={17} />
            </button>
            <motion.div
              className="relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
              style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 100px rgba(0,0,0,0.75)' }}
              initial={{ scale: 0.91, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.91, opacity: 0, y: 24 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${FILM_VIDEO_ID}?autoplay=1&rel=0`}
                title="CICT 2025 Highlight Reel"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
