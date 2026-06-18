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
        <div className="sticky top-0 h-screen w-full flex items-center justify-center">

          {/* ── Background layer — overflow-hidden stays here so the video is clipped ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Video */}
            <iframe
              title="CICT 2025 background reel"
              src={`https://www.youtube.com/embed/${BG_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${BG_VIDEO_ID}&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playsinline=1&iv_load_policy=3`}
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full"
              style={{ border: 'none' }}
            />
            {/* Deep cinematic overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.60) 50%, rgba(0,0,0,0.80) 100%)',
              }}
            />
            {/* Film-grain noise texture */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />
            {/* Cinematic letterbox vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
              }}
            />
          </div>

          {/* ── Content — no overflow-hidden so tall Arabic text is never clipped ── */}
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto w-full py-20">

            {/* Brand logo */}
            <motion.div className="flex justify-center mb-8" {...reveal(0.05)}>
              <Image
                src="/images/logos/logo_text_horizonal.png"
                alt="CICT 2026"
                width={640}
                height={128}
                className="h-10 sm:h-16 lg:h-24 w-auto object-contain"
                priority
                style={{ filter: 'brightness(1) contrast(0.95)' }}
              />
            </motion.div>

            {/* Big animated headline */}
            <h2 className="font-outfit font-bold tracking-tight leading-[0.92] mb-10 drop-shadow-[0_2px_40px_rgba(0,0,0,0.6)]">
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

            {/* Watch CTA — Liquid Glass button */}
            <motion.button
              onClick={() => setVideoOpen(true)}
              {...reveal(0.36)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 pl-2 pr-6 rtl:pr-2 rtl:pl-6 py-2 rounded-full"
              style={{
                background:           'rgba(15, 15, 18, 0.75)',
                border:               '1px solid rgba(255, 255, 255, 0.10)',
                backdropFilter:       'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow:
                  '0 4px 30px rgba(0, 0, 0, 0.40), inset 0 1px 1px rgba(255, 255, 255, 0.10)',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  boxShadow: '0 2px 12px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
                }}
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
            <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.25)' }}>{t('cinematic.scroll')}</span>
            <div
              className="w-5 h-8 rounded-full flex justify-center pt-1.5"
              style={{
                background:           'rgba(15, 15, 18, 0.60)',
                border:               '1px solid rgba(255,255,255,0.09)',
                backdropFilter:       'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              <motion.span
                className="w-1 h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.40)' }}
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
              style={{
                background:           'rgba(8, 8, 12, 0.92)',
                backdropFilter:       'blur(40px) saturate(160%)',
                WebkitBackdropFilter: 'blur(40px) saturate(160%)',
              }}
            />
            <button
              aria-label="Close video"
              onClick={() => setVideoOpen(false)}
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white transition-spatial"
              style={{
                background:           'rgba(15, 15, 18, 0.75)',
                border:               '1px solid rgba(255, 255, 255, 0.10)',
                backdropFilter:       'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30, 30, 36, 0.85)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15, 15, 18, 0.75)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)';
              }}
            >
              <X size={17} />
            </button>
            <motion.div
              className="relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
              style={{
                border:     '1px solid rgba(255,255,255,0.08)',
                boxShadow:  '0 40px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
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
