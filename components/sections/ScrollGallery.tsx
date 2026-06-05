'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { useLang } from '@/lib/i18n';

export default function ScrollGallery() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Progress 0→1 across the pinned section's scroll distance
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Media grows from a small centered card to near-full-bleed
  const mediaWidth = useTransform(scrollYProgress, [0, 1], [280, 1500]);
  const mediaHeight = useTransform(scrollYProgress, [0, 1], [340, 760]);
  const radius = useTransform(scrollYProgress, [0, 1], [24, 18]);

  // Background photo + dark overlay fade as the media takes over
  const bgOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const mediaOverlay = useTransform(scrollYProgress, [0, 1], [0.55, 0.18]);

  // Background blurs progressively as you scroll (sharp → soft)
  const bgBlur = useTransform(scrollYProgress, [0, 0.6], [0, 18]);
  const bgFilter = useMotionTemplate`blur(${bgBlur}px)`;

  // Title words split apart and fade out smoothly right from the start
  const leftX = useTransform(scrollYProgress, [0, 1], ['0vw', '-100vw']);
  const rightX = useTransform(scrollYProgress, [0, 1], ['0vw', '100vw']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Caption fades in once the media is mostly expanded
  const captionOpacity = useTransform(scrollYProgress, [0.7, 1], [0, 1]);
  const captionY = useTransform(scrollYProgress, [0.7, 1], [24, 0]);

  // Scroll hint fades out as soon as the user starts
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    // Tall section gives the pinned content room to animate
    <section ref={sectionRef} className="relative h-[200vh] md:h-[260vh] bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* ── Background photo (blurs + fades as you scroll) ── */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgFilter }}>
          <img
            src="/images/gallery/bg2.jpg"
            alt="CICT conference hall"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.08)' }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </motion.div>

        {/* ── Expanding media ── */}
        <motion.div
          className="relative z-10 overflow-hidden"
          style={{
            width: mediaWidth,
            height: mediaHeight,
            maxWidth: '94vw',
            maxHeight: '82vh',
            borderRadius: radius,
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          }}
        >
          <img
            src="/images/gallery/feature.jpg"
            alt="CICT 2025 main stage"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <motion.div className="absolute inset-0 bg-black" style={{ opacity: mediaOverlay }} />

          {/* Caption — appears when fully expanded */}
          <motion.div
            className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col items-start"
            style={{ opacity: captionOpacity, y: captionY }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70 mb-2">
              {t('gallery.caption')}
            </span>
            <h3 className="font-outfit font-bold text-white leading-tight"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.6rem)' }}>
              {t('gallery.captionTitle')}
            </h3>
          </motion.div>
        </motion.div>

        {/* ── Split title (over everything) ── */}
        <motion.div
          className="absolute z-20 flex flex-col items-center text-center pointer-events-none px-6"
          style={{ opacity: titleOpacity }}
        >
          <motion.span
            className="font-outfit font-bold text-white leading-[0.95] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', x: leftX }}
          >
            {t('gallery.titleA')}
          </motion.span>
          <motion.span
            className="font-outfit font-bold leading-[0.95] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', x: rightX, background: 'linear-gradient(to right, #67e8f9, #60a5fa, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', paddingTop: '0.2em', paddingBottom: '0.2em', lineHeight: '1.1' }}
          >
            {t('gallery.titleB')}
          </motion.span>
        </motion.div>

        {/* ── Scroll hint ── */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: hintOpacity }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">{t('gallery.scroll')}</span>
          <div className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-1.5">
            <motion.span
              className="w-1 h-1.5 rounded-full bg-white/60"
              animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
