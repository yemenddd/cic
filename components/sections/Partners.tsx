'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import type { Partner as SanityPartner } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';

const FALLBACK_PARTNERS = [
  { src: '/images/sponsors/1.png',  alt: 'Sponsor 1' },
  { src: '/images/sponsors/2.png',  alt: 'Sponsor 2' },
  { src: '/images/sponsors/3.png',  alt: 'Sponsor 3' },
  { src: '/images/sponsors/4.png',  alt: 'Sponsor 4' },
  { src: '/images/sponsors/5.png',  alt: 'Sponsor 5' },
  { src: '/images/sponsors/6.png',  alt: 'Sponsor 6' },
  { src: '/images/sponsors/7.png',  alt: 'Sponsor 7' },
  { src: '/images/sponsors/8.png',  alt: 'Sponsor 8' },
  { src: '/images/sponsors/9.png',  alt: 'Sponsor 9' },
  { src: '/images/sponsors/10.png', alt: 'Sponsor 10' },
];

export default function Partners({ data }: { data?: SanityPartner[] }) {
  const { t, dir } = useLang();
  const isRtl = dir === 'rtl';

  const partners = data?.length
    ? data.map(p => ({ src: urlFor(p.logo).width(240).fit('max').url(), alt: p.name }))
    : FALLBACK_PARTNERS;
  const track = [...partners, ...partners];

  return (
    <section className="pb-16 pt-16 md:pb-32 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-outfit font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          >
            <span
              style={{
                background: 'var(--metallic-grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span style={{ letterSpacing: '0.18em' }}>{t('partners.titleA')}</span>{' '}
              <span style={{ fontWeight: 400 }}>{t('partners.titleB')}</span>
            </span>
          </motion.h2>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Edge blurs */}
        <ProgressiveBlur direction="right" blurLayers={8} blurIntensity={0.5} className="absolute left-0 top-0 h-full w-32 z-10" />
        <ProgressiveBlur direction="left"  blurLayers={8} blurIntensity={0.5} className="absolute right-0 top-0 h-full w-32 z-10" />

        {/* Scrolling track */}
        <div className="overflow-hidden">
          <style>{`
            @keyframes marquee-ltr {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }
            @keyframes marquee-rtl {
              from { transform: translateX(0); }
              to   { transform: translateX(50%); }
            }
            .marquee-track {
              animation: ${isRtl ? 'marquee-rtl' : 'marquee-ltr'} 24s linear infinite;
            }
          `}</style>
          <div className="marquee-track flex gap-16 items-center w-max">
            {track.map((logo, i) => (
              <div key={i} className="flex items-center justify-center shrink-0 px-4">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-10 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
