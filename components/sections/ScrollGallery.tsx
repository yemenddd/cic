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
    <section ref={sectionRef} className="relative h-[200vh] md:h-[260vh]" style={{ background: '#000000' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* ── Background photo (blurs + fades as you scroll) ── */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: bgOpacity, filter: bgFilter }}>
          <img
            src="/images/gallery/bg2.jpg"
            alt="CIC conference hall"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scale(1.08)' }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </motion.div>

        {/* ── Expanding media ── */}
        <motion.div
          className="relative z-10 overflow-hidden"
          style={{
            width:      mediaWidth,
            height:     mediaHeight,
            maxWidth:   '94vw',
            maxHeight:  '82vh',
            borderRadius: radius,
            boxShadow:
              '0 30px 80px rgba(0,0,0,0.50), 0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <img
            src="/images/gallery/feature.jpg"
            alt="CIC 2025 main stage"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <motion.div className="absolute inset-0 bg-black" style={{ opacity: mediaOverlay }} />

          {/* Caption — appears when fully expanded */}
          <motion.div
            className="absolute inset-x-0 bottom-0 p-8 md:p-12 flex flex-col items-start"
            style={{ opacity: captionOpacity, y: captionY }}
          >
            {/* Liquid glass section label */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
              style={{
                background:           'var(--mat-liquid-bg)',
                backdropFilter:       'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border:               '1px solid var(--mat-liquid-border)',
                boxShadow:            'inset 0 1px 0 var(--mat-liquid-inset)',
                fontSize:             '9.5px',
                fontWeight:           700,
                letterSpacing:        '0.22em',
                textTransform:        'uppercase',
                color:                '#ffffff',
              }}
            >
              {t('gallery.caption')}
            </span>
            {/* Metallic caption heading */}
            <h3
              className="font-outfit font-bold leading-tight"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
                color:    '#ffffff',
              }}
            >
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
            className="font-outfit font-bold leading-[0.95] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]"
            style={{
              fontSize:             'clamp(2.6rem, 6vw, 5.5rem)',
              x:                    leftX,
              color: '#ffffff',
            }}
          >
            {t('gallery.titleA')}
          </motion.span>
          <motion.span
            className="font-outfit font-bold leading-[0.95] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]"
            style={{
              fontSize:             'clamp(2.6rem, 6vw, 5.5rem)',
              x:                    rightX,
              background:           'linear-gradient(90deg, #67e8f9, #60a5fa, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip:       'text',
              paddingTop:           '0.2em',
              paddingBottom:        '0.2em',
              lineHeight:           '1.1',
            }}
          >
            {t('gallery.titleB')}
          </motion.span>
        </motion.div>

        {/* ── Scroll hint — liquid glass pill ── */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          style={{ opacity: hintOpacity }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
            {t('gallery.scroll')}
          </span>
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
  );
}
