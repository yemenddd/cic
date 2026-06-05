'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { FinancialHero } from '@/components/ui/hero-section';
import FeatureCarousel from '@/components/ui/feature-carousel';
import { useLang } from '@/lib/i18n';

export default function BoldStatement() {
  const { t } = useLang();

  const whoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: whoRef,
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
    <section className="relative" style={{ background: '#030712' }}>

      {/* ── Fullscreen hero area ── */}
      <FinancialHero
        titleLine1={t('bold.titleA')}
        titleLine2White={t('bold.titleMeet')}
        titleLine2Blue={t('bold.titleMachines')}
        description={t('bold.description')}
        description2={t('bold.description2')}
        buttonText={t('bold.explore')}
        buttonLink="#program"
        imageUrl1="/images/about/1.jpg"
        imageUrl2="/images/about/2.jpg"
      />

      {/* ── Who it's for — scroll-reveal ── */}
      <div ref={whoRef} className="relative h-[200vh]">
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6 w-full py-8">



            {/* Headline */}
            <div className="text-center mb-8">
              <h3
                className="font-outfit font-bold tracking-tight"
                style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', lineHeight: 1.05 }}
              >
                <motion.span className="inline-block text-white" {...revealWord(0.12)}>
                  {t('bold.whoTitleA')}
                </motion.span>
                {' '}
                <motion.span className="inline-block py-[0.15em] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent" {...revealWord(0.19)}>
                  {t('bold.whoTitleB')}
                </motion.span>
              </h3>
            </div>

            {/* Carousel */}
            <FeatureCarousel currentP={currentP} />

          </div>
        </div>
      </div>

    </section>
  );
}
