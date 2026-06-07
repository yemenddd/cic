'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { CircularGallery } from '@/components/ui/circular-gallery';
import type { GalleryItem } from '@/components/ui/circular-gallery';
import { useLang } from '@/lib/i18n';

// ── 10 curated photos ────────────────────────────────────────────────────────
const ITEMS: GalleryItem[] = [
  {
    label: 'افتتاح المؤتمر',
    sublabel: 'الدورة الأولى · 2023',
    photo: { url: '/images/gallery/DSC02311-Pano.jpg', text: 'Conference opening ceremony' },
  },
  {
    label: 'جلسة الخبراء',
    sublabel: 'الدورة الأولى · 2023',
    photo: { url: '/images/gallery/DSC02581.jpg', text: 'Expert panel session' },
  },
  {
    label: 'لحظة التكريم',
    sublabel: 'الدورة الثانية · 2024',
    photo: { url: '/images/gallery/DSC06161.jpg', text: 'Awards moment' },
  },
  {
    label: 'المبدعون الشباب',
    sublabel: 'الدورة الثانية · 2024',
    photo: { url: '/images/gallery/نسخة من DSC001721 (26).JPG', text: 'Young innovators' },
  },
  {
    label: 'ورشة التقنية',
    sublabel: 'الدورة الثانية · 2024',
    photo: { url: '/images/gallery/نسخة من DSC00201.jpg', text: 'Technology workshop' },
  },
  {
    label: 'الحضور الدولي',
    sublabel: 'الدورة الثالثة · 2025',
    photo: { url: '/images/gallery/نسخة من DSC00334.jpg', text: 'International attendance' },
  },
  {
    label: 'المنصة الرئيسية',
    sublabel: 'الدورة الثالثة · 2025',
    photo: { url: '/images/gallery/نسخة من DSC09376.jpg', text: 'Main stage' },
  },
  {
    label: 'لقاءات وأفكار',
    sublabel: 'الدورة الثالثة · 2025',
    photo: { url: '/images/gallery/نسخة من DSC09499.jpg', text: 'Networking and ideas' },
  },
  {
    label: 'عرض المشاريع',
    sublabel: 'الدورة الثالثة · 2025',
    photo: { url: '/images/gallery/نسخة من DSC09642.jpg', text: 'Project showcase' },
  },
  {
    label: 'أثر يمتد',
    sublabel: 'ثلاث دورات · 2023-2025',
    photo: { url: '/images/gallery/feature.jpg', text: 'Lasting impact' },
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CircularGallerySection() {
  const { dir, lang } = useLang();
  const isRtl = dir === 'rtl';
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);

  // Scroll progress tied exactly to this section's scroll height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map 0→1 scroll progress to 0→360° rotation
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setRotation(v * 360);
  });

  const headingOpacity = useTransform(scrollYProgress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
  const headingY       = useTransform(scrollYProgress, [0, 0.12], [32, 0]);

  const eyebrow  = '';
  const titleA   = lang === 'ar' ? 'استعرض '            : lang === 'tr' ? 'Baskılarımıza '   : 'Explore ';
  const titleB   = lang === 'ar' ? 'دوراتنا'             : lang === 'tr' ? 'Göz Atın'         : 'Our Editions';
  const subtitle = lang === 'ar'
    ? 'مرّر للأسفل لتستعرض لحظات المؤتمر عبر دوراته الثلاث.'
    : lang === 'tr'
    ? 'Üç baskıdan konferans anlarını keşfetmek için aşağı kaydırın.'
    : 'Scroll down to explore conference moments across three editions.';

  return (
    // Outer: tall container that provides the scroll space (300vh)
    <div ref={containerRef} className="relative" style={{ height: '300vh' }}>

      {/* Sticky viewport — stays fixed while scrolling through the 300vh */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#030712]">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #06b6d4 0%, #7c3aed 50%, transparent 70%)' }}
          />
        </div>

        {/* Section heading — fades in then out */}
        <motion.div
          style={{ opacity: headingOpacity, y: headingY }}
          className="absolute inset-x-0 top-28 md:top-44 z-20 text-center px-6 pointer-events-none"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <h2 className="text-4xl font-black text-white sm:text-5xl leading-tight">
            {titleA}
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {titleB}
            </span>
          </h2>
          <p className="mt-3 text-sm text-white/40 max-w-sm mx-auto">{subtitle}</p>
        </motion.div>

        {/* Circular Gallery — vertically centred in the space below the nav */}
        <div className="absolute inset-0 pt-44 pb-8 flex items-center justify-center">
          <CircularGallery
            items={ITEMS}
            rotation={isRtl ? -rotation : rotation}
            radius={520}
            className="w-full h-full"
          />
        </div>


        {/* Bottom edge fade into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{ background: 'linear-gradient(to top, #030712, transparent)' }} />
      </div>
    </div>
  );
}
