'use client';

import { Sparkles } from '@/components/ui/sparkles';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { useLang } from '@/lib/i18n';
import { motion } from 'framer-motion';

const partners = [
  '/images/sponsors/1.png',
  '/images/sponsors/2.png',
  '/images/sponsors/3.png',
  '/images/sponsors/4.png',
  '/images/sponsors/5.png',
  '/images/sponsors/6.png',
  '/images/sponsors/7.png',
  '/images/sponsors/8.png',
  '/images/sponsors/9.png',
  '/images/sponsors/10.png',
];

export default function Partners() {
  const { t } = useLang();
  return (
    <section className="relative w-full overflow-hidden bg-[#030712]">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 text-center relative z-10">

        <motion.h2 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-5 font-outfit font-bold tracking-tight text-3xl md:text-4xl lg:text-5xl text-white drop-shadow-md"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            {t('partners.titleA')}
          </span>{' '}
          <span className="text-white/40 font-normal">{t('partners.titleB')}</span>
        </motion.h2>
      </div>

      {/* Infinite slider — logo lockups */}
      <div className="relative mt-12 h-[64px] z-10">
        <InfiniteSlider className="flex h-full w-full items-center" duration={35} gap={56}>
          {partners.map((src, idx) => (
            <div
              key={idx}
              dir="ltr"
              className="group flex items-center justify-center whitespace-nowrap select-none transition-opacity duration-300"
              style={{ opacity: 0.55 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = '0.55')}
            >
              <img 
                src={src} 
                alt={`Sponsor ${idx + 1}`} 
                loading="lazy"
                decoding="async"
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ filter: 'brightness(0) invert(1)' }} /* Makes them all white if they are dark logos, optional but good for dark theme */
              />
            </div>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 left-0 h-full w-12 md:w-48"
          direction="left"
          blurIntensity={0.8}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute top-0 right-0 h-full w-12 md:w-48"
          direction="right"
          blurIntensity={0.8}
        />
      </div>

      {/* Sparkle horizon — brand blue glow on dark */}
      <div className="relative -mt-6 h-36 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#0078D4,transparent_70%)] before:opacity-30" />
        <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] bg-[#030712]" />
        <Sparkles
          density={900}
          color="#60a5fa"
          size={1.1}
          opacity={0.8}
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>
    </section>
  );
}
