'use client';

import { motion } from 'framer-motion';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { useLang } from '@/lib/i18n';

const partners = [
  { src: '/images/sponsors/1.png',  alt: 'Sponsor 1',  height: 40 },
  { src: '/images/sponsors/2.png',  alt: 'Sponsor 2',  height: 40 },
  { src: '/images/sponsors/3.png',  alt: 'Sponsor 3',  height: 40 },
  { src: '/images/sponsors/4.png',  alt: 'Sponsor 4',  height: 40 },
  { src: '/images/sponsors/5.png',  alt: 'Sponsor 5',  height: 40 },
  { src: '/images/sponsors/6.png',  alt: 'Sponsor 6',  height: 40 },
  { src: '/images/sponsors/7.png',  alt: 'Sponsor 7',  height: 40 },
  { src: '/images/sponsors/8.png',  alt: 'Sponsor 8',  height: 40 },
  { src: '/images/sponsors/9.png',  alt: 'Sponsor 9',  height: 40 },
  { src: '/images/sponsors/10.png', alt: 'Sponsor 10', height: 40 },
];

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring', bounce: 0.3, duration: 1.5 },
    },
  },
};

export default function Partners() {
  const { t } = useLang();

  return (
    <section className="pb-16 pt-16 md:pb-32" style={{ background: 'var(--bg-base)' }}>
      <div className="group relative m-auto max-w-5xl px-6">

        {/* Title */}
        <div className="text-center mb-4">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-outfit font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            <span
              className="block"
              style={{
                background: 'var(--metallic-grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('partners.titleA')}
            </span>
            <span
              className="block"
              style={{
                background: 'var(--metallic-grad-muted)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('partners.titleB')}
            </span>
          </motion.h2>
        </div>

        <AnimatedGroup
          variants={{
            container: {
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: 0.75 },
              },
            },
            ...transitionVariants,
          }}
          className="mx-auto mt-12 grid grid-cols-5 gap-x-12 gap-y-8 transition-all duration-500 sm:gap-x-16 sm:gap-y-14"
        >
          {partners.map((logo, index) => (
            <div key={index} className="flex">
              <img
                className="mx-auto h-auto w-fit opacity-70 hover:opacity-100 transition-opacity duration-300"
                src={logo.src}
                alt={logo.alt}
                height={logo.height}
                width="auto"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </AnimatedGroup>
      </div>
    </section>
  );
}
