'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ── Images split across two rows ────────────────────────────────────────────
const ROW1 = [
  '/images/gallery/DSC02311-Pano.jpg',
  '/images/gallery/DSC02581.jpg',
  '/images/gallery/DSC06161.jpg',
  '/images/gallery/DSC06230-Pano.jpg',
  '/images/gallery/DSC08020 - 1.jpg',
  '/images/gallery/DSC_0949.JPG',
  '/images/gallery/نسخة من DSC001721 (26).JPG',
  '/images/gallery/نسخة من DSC001721 (38).JPG',
  '/images/gallery/نسخة من DSC001721 (73).JPG',
  '/images/gallery/نسخة من DSC00201.jpg',
  '/images/gallery/نسخة من DSC00334.jpg',
  '/images/gallery/نسخة من DSC00365-Pano-2.jpg',
  '/images/gallery/نسخة من DSC00536.jpg',
  '/images/gallery/نسخة من DSC00631.jpg',
  '/images/gallery/نسخة من DSC00709-Pano.jpg',
  '/images/gallery/نسخة من DSC00721.jpg',
  '/images/gallery/نسخة من DSC00740.jpg',
  '/images/gallery/نسخة من DSC00746.jpg',
  '/images/gallery/نسخة من DSC00756-Pano.jpg',
];

const ROW2 = [
  '/images/gallery/نسخة من DSC00813.jpg',
  '/images/gallery/نسخة من DSC06819.jpg',
  '/images/gallery/نسخة من DSC07197-Pano.jpg',
  '/images/gallery/نسخة من DSC07226.jpg',
  '/images/gallery/نسخة من DSC07350.jpg',
  '/images/gallery/نسخة من DSC07428.jpg',
  '/images/gallery/نسخة من DSC08369.JPG',
  '/images/gallery/نسخة من DSC09376.jpg',
  '/images/gallery/نسخة من DSC09411.jpg',
  '/images/gallery/نسخة من DSC09499.jpg',
  '/images/gallery/نسخة من DSC09642.jpg',
  '/images/gallery/نسخة من DSC09688.jpg',
  '/images/gallery/نسخة من DSC09719.jpg',
  '/images/gallery/نسخة من DSC09780.JPG',
  '/images/gallery/نسخة من DSC09806.jpg',
  '/images/gallery/نسخة من DSC09814-Pano.jpg',
  '/images/gallery/نسخة من DSC09836.jpg',
  '/images/gallery/bg2.jpg',
  '/images/gallery/feature.jpg',
];

// ── Tilt card ────────────────────────────────────────────────────────────────
function TiltCard({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)');
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;   // 0→1
    const py = (e.clientY - rect.top) / rect.height;    // 0→1
    const rx = (py - 0.5) * -14;   // rotateX: up/down
    const ry = (px - 0.5) * 14;    // rotateY: left/right
    setTransform(`perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.06)`);
    setShinePos({ x: px * 100, y: py * 100 });
  };

  const onEnter = () => setHovered(true);
  const onLeave = () => {
    setHovered(false);
    setTransform('perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)');
    setShinePos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        transform,
        transition: hovered ? 'transform 0.08s ease' : 'transform 0.5s ease',
        willChange: 'transform',
      }}
      className="relative h-56 w-80 flex-shrink-0 overflow-hidden rounded-2xl cursor-pointer select-none"
    >
      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        loading="lazy"
        className="h-full w-full object-cover pointer-events-none"
      />

      {/* Persistent bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Cursor-tracking shine */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.12) 0%, transparent 65%)`,
        }}
      />

      {/* Edge highlight ring on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        }}
      />
    </div>
  );
}

// ── Infinite marquee row ─────────────────────────────────────────────────────
function MarqueeRow({
  images,
  direction = 'left',
  speed = 70,
}: {
  images: string[];
  direction?: 'left' | 'right';
  speed?: number;
}) {
  const x = useMotionValue(0);
  const innerRef = useRef<HTMLDivElement>(null);
  const halfW = useRef(0);
  const paused = useRef(false);
  const [ready, setReady] = useState(false);

  // Initialize right-direction offset to -halfW so it looks seamless from the start
  useEffect(() => {
    if (!innerRef.current) return;
    halfW.current = innerRef.current.scrollWidth / 2;
    if (direction === 'right') x.set(-halfW.current);
    setReady(true);
  }, [direction, x]);

  useAnimationFrame((_, delta) => {
    if (paused.current || !ready || !innerRef.current) return;
    halfW.current = innerRef.current.scrollWidth / 2;
    const vel = (delta / 1000) * speed;
    let next = direction === 'left' ? x.get() - vel : x.get() + vel;
    if (direction === 'left' && next <= -halfW.current) next += halfW.current;
    if (direction === 'right' && next >= 0) next -= halfW.current;
    x.set(next);
  });

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <motion.div
        ref={innerRef}
        style={{ x }}
        className="flex gap-4 w-max"
      >
        {[...images, ...images].map((src, i) => (
          <TiltCard key={i} src={src} />
        ))}
      </motion.div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;

export default function PhotoMarquee() {
  const { dir, lang } = useLang();
  const isRtl = dir === 'rtl';

  const eyebrow  = lang === 'ar' ? 'من دوراتنا الثلاث' : lang === 'tr' ? 'Önceki Baskılardan' : 'Across Three Editions';
  const titleA   = lang === 'ar' ? 'لحظات ' : lang === 'tr' ? 'Unutulmaz ' : 'Moments ';
  const titleB   = lang === 'ar' ? 'لا تُنسى' : lang === 'tr' ? 'Anlar' : 'We Carry';
  const subtitle = lang === 'ar'
    ? 'صور حقيقية من ملتقى المبدعين والمبتكرين على مدار ثلاث دورات متتالية.'
    : lang === 'tr'
    ? 'Üç yıl boyunca yaratıcılar ve yenilikçilerin buluşmasından gerçek kareler.'
    : 'Real shots from three consecutive editions of creators and innovators coming together.';
  const cta = lang === 'ar' ? 'عرض المعرض كاملًا' : lang === 'tr' ? 'Tüm Galeriyi Gör' : 'View Full Gallery';

  return (
    <section className="relative bg-[#030712] py-28 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Heading ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mb-16 px-6 text-center"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-400/80">
          {eyebrow}
        </span>

        <h2 className="text-4xl font-black text-white sm:text-5xl md:text-6xl leading-tight">
          {titleA}
          <span
            className="inline"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {titleB}
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/40">
          {subtitle}
        </p>
      </motion.div>

      {/* ── Row 1 — scrolls left ──────────────────────────────────── */}
      <div className="relative mb-4">
        <MarqueeRow images={ROW1} direction="left" speed={65} />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#030712] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#030712] to-transparent z-10" />
      </div>

      {/* ── Row 2 — scrolls right (slightly slower for depth) ─────── */}
      <div className="relative">
        <MarqueeRow images={ROW2} direction="right" speed={48} />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#030712] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#030712] to-transparent z-10" />
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.2 }}
        className="mt-14 flex justify-center"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <Link
          href="/gallery"
          className={cn(
            'group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-white/70 backdrop-blur-sm transition-all duration-300',
            'hover:border-violet-400/30 hover:bg-white/10 hover:text-white',
            isRtl && 'flex-row-reverse',
          )}
        >
          {cta}
          <ArrowRight
            className={cn('h-4 w-4 transition-transform duration-300 group-hover:translate-x-1', isRtl && 'rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0')}
          />
        </Link>
      </motion.div>
    </section>
  );
}
