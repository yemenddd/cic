'use client';

import { Sparkles } from '@/components/ui/sparkles';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import { useLang } from '@/lib/i18n';
import { motion } from 'framer-motion';

const partners = [
  { src: "/images/sponsors/1.png",  alt: "Sponsor 1"  },
  { src: "/images/sponsors/2.png",  alt: "Sponsor 2"  },
  { src: "/images/sponsors/3.png",  alt: "Sponsor 3"  },
  { src: "/images/sponsors/4.png",  alt: "Sponsor 4"  },
  { src: "/images/sponsors/5.png",  alt: "Sponsor 5"  },
  { src: "/images/sponsors/6.png",  alt: "Sponsor 6"  },
  { src: "/images/sponsors/7.png",  alt: "Sponsor 7"  },
  { src: "/images/sponsors/8.png",  alt: "Sponsor 8"  },
  { src: "/images/sponsors/9.png",  alt: "Sponsor 9"  },
  { src: "/images/sponsors/10.png", alt: "Sponsor 10" },
];

export default function Partners() {
  const { t } = useLang();
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 text-center relative z-10">

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-outfit font-bold tracking-tight"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
        >
          {/* Metallic gradient — Apple WWDC26 heading spec */}
          <span
            className="block"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #A2A2A6 100%)',
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
              background: 'linear-gradient(180deg, #A2A2A6 0%, rgba(162, 162, 166, 0.38) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('partners.titleB')}..
          </span>
        </motion.h2>
      </div>

      {/* Infinite logo slider */}
      <div className="relative mt-12 h-16 z-10">
<InfiniteSlider className="flex h-full w-full items-center" duration={35} gap={72}>
          {partners.map(p => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              className="h-10 w-auto max-w-[130px] object-contain select-none transition-all duration-300 opacity-70 hover:opacity-100"
            />
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

      {/* Sparkle horizon */}
      <div className="relative -mt-6 h-36 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,rgba(96,165,250,0.40),transparent_70%)]" />
        <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%]" style={{ background: 'var(--bg-base)' }} />
        <Sparkles
          density={900}
          color="#93c5fd"
          size={1.1}
          opacity={0.7}
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>
    </section>
  );
}
