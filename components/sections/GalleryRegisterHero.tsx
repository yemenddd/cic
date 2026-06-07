'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionValueEvent,
} from 'framer-motion';
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

const TOTAL = IMAGES.length;
const IMG_W = 60;
const IMG_H = 85;
const lerp  = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ── Flip card ─────────────────────────────────────────────────────────────────
function FlipCard({ src, target }: {
  src: string;
  target: { x: number; y: number; rotation: number; scale: number };
}) {
  return (
    <motion.div
      animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale }}
      initial={{ opacity: 0 }}
      animate-opacity={1}
      transition={{ type: 'spring', stiffness: 50, damping: 18 }}
      style={{ position: 'absolute', width: IMG_W, height: IMG_H, perspective: '1000px', opacity: 1 }}
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GalleryRegisterHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = innerRef.current; if (!el) return;
    const obs = new ResizeObserver(e => setSize({ w: e[0].contentRect.width, h: e[0].contentRect.height }));
    obs.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // ── Scroll tied to the outer container ──────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  // morph: 0 = circle  →  1 = arc    (driven by page scroll, fully reversible)
  const morphRaw = useTransform(scrollYProgress, [0.05, 0.65], [0, 1]);
  const morph    = useSpring(morphRaw, { stiffness: 55, damping: 22 });

  // Mouse parallax (horizontal only, for arc depth)
  const mouseX   = useMotionValue(0);
  const smoothPx = useSpring(mouseX, { stiffness: 30, damping: 20 });
  useEffect(() => {
    const el = innerRef.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set(((e.clientX - r.left) / r.width * 2 - 1) * 70);
    };
    el.addEventListener('mousemove', fn);
    return () => el.removeEventListener('mousemove', fn);
  }, [mouseX]);

  // Live values for card position math
  const [m, setM]   = useState(0);
  const [px, setPx] = useState(0);
  useMotionValueEvent(morph,    'change', setM);
  useMotionValueEvent(smoothPx, 'change', setPx);

  // Text in circle center — fades out as cards start moving
  const circleTxtOpacity = useTransform(morph, [0, 0.35], [1, 0]);
  const circleTxtScale   = useTransform(morph, [0, 0.35], [1, 0.85]);

  // CTA — fades in when arc is mostly formed
  const ctaOpacity = useTransform(morph, [0.55, 0.95], [0, 1]);
  const ctaY       = useTransform(morph, [0.55, 0.95], [28, 0]);

  const text = {
    center: lang === 'ar' ? 'معاً نبني المستقبل'     : lang === 'tr' ? 'Birlikte Geleceği İnşa Ediyoruz' : 'Together We Build The Future',
    tag:    lang === 'ar' ? 'انضم إلى المؤتمر'        : lang === 'tr' ? 'Konferansa Katıl'  : 'Join the Conference',
    titleA: lang === 'ar' ? 'احجز مقعدك '             : lang === 'tr' ? 'Yerinizi '         : 'Secure your ',
    titleB: lang === 'ar' ? 'قبل نفاد الأماكن'        : lang === 'tr' ? 'Şimdi Ayırın'      : 'seat now.',
    sub:    lang === 'ar' ? 'يومان من الإلهام والابتكار — كن جزءًا من اللحظة.' : lang === 'tr' ? 'İlhamın iki günü — bu anın parçası ol.' : 'Two days of inspiration — be part of the moment.',
    btn:    lang === 'ar' ? 'سجّل الآن'               : lang === 'tr' ? 'Kayıt Ol'          : 'Register Now',
  };

  return (
    // ── Outer: provides 250vh of scroll space ─────────────────────────────────
    <div ref={outerRef} style={{ height: '250vh' }}>

      {/* ── Inner: sticky viewport ────────────────────────────────────────── */}
      <div
        ref={innerRef}
        className="sticky top-0 w-full overflow-hidden bg-[#030712]"
        style={{ height: '100vh' }}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, #06b6d4 60%, transparent 100%)' }}
          />
        </div>

        {/* ── "معاً نبني المستقبل" — visible in circle state ─────────────── */}
        <motion.div
          style={{ opacity: circleTxtOpacity, scale: circleTxtScale }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6"
        >
          <h2
            className="font-black text-white leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 3.5rem)' }}
          >
            {text.center.split(' ').map((word, i) => (
              <span key={i}>
                {i === (isRtl ? 1 : 2) ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>{word}</span>
                ) : word}
                {i < text.center.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))}
          </h2>
        </motion.div>

        {/* ── Registration CTA — appears as arc forms ─────────────────────── */}
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="pointer-events-none absolute top-[7%] inset-x-0 z-20 flex flex-col items-center justify-center text-center px-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-3">
            {text.tag}
          </p>
          <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.8rem)' }}>
            {text.titleA}
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{text.titleB}</span>
          </h2>
          <p className="text-sm text-white/40 max-w-sm mb-7 leading-relaxed">{text.sub}</p>
          <div className="pointer-events-auto">
            <Link
              href="/register"
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]',
                isRtl && 'flex-row-reverse',
              )}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)' }}
            >
              {text.btn}
              <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            </Link>
          </div>
        </motion.div>

        {/* ── Cards ──────────────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center w-full h-full">
          {IMAGES.map((src, i) => {
            const isMobile = size.w < 768;
            const minDim   = Math.min(size.w, size.h);

            // Circle position (centred in viewport)
            const circleR = Math.min(minDim * 0.35, 340);
            const cAngle  = (i / TOTAL) * 360;
            const cRad    = (cAngle * Math.PI) / 180;
            const circle  = {
              x: Math.cos(cRad) * circleR,
              y: Math.sin(cRad) * circleR,
              rotation: cAngle + 90,
              scale: 1,
            };

            // Arc position (fan sliding to the bottom)
            const baseR  = Math.min(size.w, size.h * 1.5);
            const arcR   = baseR * (isMobile ? 1.4 : 1.1);
            const apexY  = size.h * (isMobile ? 0.38 : 0.30);
            const arcCY  = apexY + arcR;
            const spread = isMobile ? 105 : 135;
            const start  = -90 - spread / 2;
            const step   = spread / (TOTAL - 1);
            const arcAngle = start + i * step;
            const arcRad   = (arcAngle * Math.PI) / 180;
            const arc = {
              x: Math.cos(arcRad) * arcR + px,
              y: Math.sin(arcRad) * arcR + arcCY,
              rotation: arcAngle + 90,
              scale: isMobile ? 1.45 : 1.85,
            };

            // Lerp driven by page scroll — fully reversible
            const target = {
              x:        lerp(circle.x,        arc.x,        m),
              y:        lerp(circle.y,        arc.y,        m),
              rotation: lerp(circle.rotation, arc.rotation, m),
              scale:    lerp(circle.scale,    arc.scale,    m),
            };

            return <FlipCard key={i} src={src} target={target} />;
          })}
        </div>

        {/* Bottom fade into next section */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{ background: 'linear-gradient(to top, #030712, transparent)' }}
        />
      </div>
    </div>
  );
}
