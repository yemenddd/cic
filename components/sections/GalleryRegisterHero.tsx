'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const IMAGES = [
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
  '/images/gallery/نسخة من DSC09376.jpg',
  '/images/gallery/نسخة من DSC09499.jpg',
  '/images/gallery/نسخة من DSC09642.jpg',
  '/images/gallery/نسخة من DSC09688.jpg',
  '/images/gallery/نسخة من DSC09806.jpg',
  '/images/gallery/feature.jpg',
];

const TOTAL  = IMAGES.length;
const MAX_SCROLL = 2000;
const IMG_W  = 60;
const IMG_H  = 85;
const lerp   = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ── Flip card ────────────────────────────────────────────────────────────────
function FlipCard({ src, target }: {
  src: string;
  target: { x: number; y: number; rotation: number; scale: number };
}) {
  return (
    <motion.div
      animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 45, damping: 16 }}
      style={{ position: 'absolute', width: IMG_W, height: IMG_H, perspective: '1000px' }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden rounded-xl shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
        </div>
        {/* Back */}
        <div className="absolute inset-0 overflow-hidden rounded-xl flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(6,182,212,0.12)',
            border: '1px solid rgba(6,182,212,0.3)',
          }}>
          <p className="text-[8px] font-bold uppercase tracking-widest text-cyan-400 mb-0.5">CICT</p>
          <p className="text-[9px] font-semibold text-white">2026</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function GalleryRegisterHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const obs = new ResizeObserver(e => setSize({ w: e[0].contentRect.width, h: e[0].contentRect.height }));
    obs.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // Virtual scroll — wheel inside the container
  const virtualScroll = useMotionValue(0);
  const scrollRef     = useRef(0);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      e.preventDefault();
      const dy = ty - e.touches[0].clientY; ty = e.touches[0].clientY;
      const next = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL);
      scrollRef.current = next; virtualScroll.set(next);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [virtualScroll]);

  // morph: 0 = circle · 1 = arc   (bidirectional with scroll)
  const morphRaw   = useTransform(virtualScroll, [0, 800], [0, 1]);
  const morph      = useSpring(morphRaw, { stiffness: 45, damping: 18 });

  // Arc shuffle rotation (after morph completes)
  const rotateRaw  = useTransform(virtualScroll, [800, MAX_SCROLL], [0, 360]);
  const smoothRot  = useSpring(rotateRaw, { stiffness: 40, damping: 20 });

  // Mouse parallax
  const mouseX     = useMotionValue(0);
  const smoothPx   = useSpring(mouseX, { stiffness: 30, damping: 20 });
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set(((e.clientX - r.left) / r.width * 2 - 1) * 80);
    };
    el.addEventListener('mousemove', fn);
    return () => el.removeEventListener('mousemove', fn);
  }, [mouseX]);

  // Live values for JS calculations
  const [m, setM]   = useState(0);
  const [rot, setR] = useState(0);
  const [px, setPx] = useState(0);
  useEffect(() => {
    const u1 = morph.on('change', setM);
    const u2 = smoothRot.on('change', setR);
    const u3 = smoothPx.on('change', setPx);
    return () => { u1(); u2(); u3(); };
  }, [morph, smoothRot, smoothPx]);

  const text = {
    tag:   lang === 'ar' ? 'انضم إلى المؤتمر'       : lang === 'tr' ? 'Konferansa Katıl' : 'Join the Conference',
    titleA:lang === 'ar' ? 'احجز مقعدك '             : lang === 'tr' ? 'Yerinizi '        : 'Secure your ',
    titleB:lang === 'ar' ? 'قبل نفاد الأماكن'        : lang === 'tr' ? 'Şimdi Ayırın'     : 'seat now.',
    sub:   lang === 'ar' ? 'يومان من الإلهام — كن جزءًا من اللحظة.' : lang === 'tr' ? 'İlhamın iki günü — bu anın parçası ol.' : 'Two days of inspiration — be part of the moment.',
    btn:   lang === 'ar' ? 'سجّل الآن'               : lang === 'tr' ? 'Kayıt Ol'         : 'Register Now',
  };

  // CTA opacity: fades in when morph > 0.6, fades out when morph < 0.4
  const ctaOpacity = useTransform(morph, [0.5, 0.9], [0, 1]);
  const ctaY       = useTransform(morph, [0.5, 0.9], [20, 0]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#030712] overflow-hidden"
      style={{ height: '100vh' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, #06b6d4 60%, transparent 100%)' }} />
      </div>

      {/* CTA text — fades in as arc forms, fades out as circle returns */}
      <motion.div
        style={{ opacity: ctaOpacity, y: ctaY }}
        className="pointer-events-none absolute top-[8%] inset-x-0 z-20 flex flex-col items-center justify-center text-center px-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-3">{text.tag}</p>
        <h2 className="text-3xl font-black text-white sm:text-5xl mb-3">
          {text.titleA}
          <span style={{
            background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{text.titleB}</span>
        </h2>
        <p className="text-sm text-white/40 max-w-sm mb-6 leading-relaxed">{text.sub}</p>
        <div className="pointer-events-auto">
          <Link
            href="/register"
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]',
              isRtl && 'flex-row-reverse',
            )}
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }}
          >
            {text.btn}
            <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
          </Link>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="relative flex items-center justify-center w-full h-full">
        {IMAGES.map((src, i) => {
          const isMobile = size.w < 768;
          const minDim   = Math.min(size.w, size.h);

          // ── Circle position ──
          const circleR   = Math.min(minDim * 0.35, 340);
          const cAngle    = (i / TOTAL) * 360;
          const cRad      = (cAngle * Math.PI) / 180;
          const circle    = {
            x: Math.cos(cRad) * circleR,
            y: Math.sin(cRad) * circleR,
            rotation: cAngle + 90,
            scale: 1,
          };

          // ── Arc (bottom fan) position ──
          const baseR  = Math.min(size.w, size.h * 1.5);
          const arcR   = baseR * (isMobile ? 1.4 : 1.1);
          const apexY  = size.h * (isMobile ? 0.35 : 0.28);
          const arcCY  = apexY + arcR;
          const spread = isMobile ? 100 : 130;
          const start  = -90 - spread / 2;
          const step   = spread / (TOTAL - 1);
          const scrollPct  = Math.min(Math.max(rot / 360, 0), 1);
          const boundedRot = -scrollPct * spread * 0.8;
          const arcAngle   = start + i * step + boundedRot;
          const arcRad     = (arcAngle * Math.PI) / 180;
          const arc = {
            x: Math.cos(arcRad) * arcR + px,
            y: Math.sin(arcRad) * arcR + arcCY,
            rotation: arcAngle + 90,
            scale: isMobile ? 1.4 : 1.8,
          };

          // ── Lerp between them using morph ──
          const target = {
            x:        lerp(circle.x,        arc.x,        m),
            y:        lerp(circle.y,        arc.y,        m),
            rotation: lerp(circle.rotation, arc.rotation, m),
            scale:    lerp(circle.scale,    arc.scale,    m),
          };

          return <FlipCard key={i} src={src} target={target} />;
        })}
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(to top, #030712, transparent)' }} />
    </div>
  );
}
