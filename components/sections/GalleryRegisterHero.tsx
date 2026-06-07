'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ── Conference gallery images (20 picks) ────────────────────────────────────
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

const TOTAL_IMAGES = IMAGES.length;
const MAX_SCROLL = 3000;
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

type Phase = 'scatter' | 'line' | 'circle' | 'arc';
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ── Flip card ────────────────────────────────────────────────────────────────
function FlipCard({ src, index, target }: {
  src: string; index: number;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}) {
  return (
    <motion.div
      animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: target.opacity }}
      transition={{ type: 'spring', stiffness: 40, damping: 15 }}
      style={{ position: 'absolute', width: IMG_WIDTH, height: IMG_HEIGHT, perspective: '1000px' }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
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
        <div
          className="absolute inset-0 overflow-hidden rounded-xl flex flex-col items-center justify-center p-2"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'rgba(6,182,212,0.12)',
            border: '1px solid rgba(6,182,212,0.3)',
          }}
        >
          <p className="text-[8px] font-bold uppercase tracking-widest text-cyan-400 mb-0.5">CICT</p>
          <p className="text-[9px] font-semibold text-white">2026</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function GalleryRegisterHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';

  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('scatter');
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(e => {
      setSize({ w: e[0].contentRect.width, h: e[0].contentRect.height });
    });
    obs.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // Auto intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('line'), 400);
    const t2 = setTimeout(() => setPhase('circle'), 2200);
    const t3 = setTimeout(() => setPhase('arc'), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Virtual scroll (wheel inside container)
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (phase !== 'arc') return;
      e.preventDefault();
      const next = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
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
  }, [phase, virtualScroll]);

  // Morph: circle → arc
  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph    = useSpring(morphProgress, { stiffness: 40, damping: 20 });
  const scrollRotate   = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothRotate   = useSpring(scrollRotate,   { stiffness: 40, damping: 20 });

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseX.set(((e.clientX - r.left) / r.width * 2 - 1) * 100);
    };
    el.addEventListener('mousemove', fn);
    return () => el.removeEventListener('mousemove', fn);
  }, [mouseX]);

  // Live values
  const [morph, setMorph]   = useState(0);
  const [rotate, setRotate] = useState(0);
  const [px, setPx]         = useState(0);
  useEffect(() => {
    const u1 = smoothMorph.on('change', setMorph);
    const u2 = smoothRotate.on('change', setRotate);
    const u3 = smoothMouseX.on('change', setPx);
    return () => { u1(); u2(); u3(); };
  }, [smoothMorph, smoothRotate, smoothMouseX]);

  // Arc starts immediately visible when phase === 'arc'
  const arcVisible = phase === 'arc';
  const ctaOpacity  = useTransform(smoothMorph, [0.75, 1], [0, 1]);
  const ctaY        = useTransform(smoothMorph, [0.75, 1], [24, 0]);

  // Scatter seed
  const scatter = useMemo(() => IMAGES.map(() => ({
    x: (Math.random() - 0.5) * 1500,
    y: (Math.random() - 0.5) * 900,
    rotation: (Math.random() - 0.5) * 180,
    scale: 0.6, opacity: 0,
  })), []);

  const text = {
    tag:     lang === 'ar' ? 'انضم إلى المؤتمر' : lang === 'tr' ? 'Konferansa Katıl' : 'Join the Conference',
    titleA:  lang === 'ar' ? 'احجز مقعدك' : lang === 'tr' ? 'Yerinizi' : 'Secure your',
    titleB:  lang === 'ar' ? 'قبل نفاد الأماكن' : lang === 'tr' ? 'Şimdiden Ayırın' : 'seat now.',
    sub:     lang === 'ar'
      ? 'يومان من الإلهام والابتكار — كن جزءًا من اللحظة.'
      : lang === 'tr'
      ? 'İki günlük ilham ve inovasyon — bu anın bir parçası olun.'
      : 'Two days of inspiration and innovation — be part of the moment.',
    btn:     lang === 'ar' ? 'سجّل الآن' : lang === 'tr' ? 'Kayıt Ol' : 'Register Now',
  };

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

      {/* ── Teaser text (fades out as arc forms) ──────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={
            arcVisible && morph < 0.5
              ? { opacity: 1 - morph * 2, y: 0, filter: 'blur(0px)' }
              : phase === 'circle' && morph === 0
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, filter: 'blur(8px)' }
          }
          transition={{ duration: 0.9 }}
          className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-3"
        >
          {text.tag}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={
            arcVisible && morph < 0.5
              ? { opacity: 1 - morph * 2, y: 0, filter: 'blur(0px)' }
              : phase === 'circle' && morph === 0
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, filter: 'blur(8px)' }
          }
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-3xl font-black text-white sm:text-5xl"
        >
          {text.titleA}{' '}
          <span style={{
            background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{text.titleB}</span>
        </motion.h2>
      </div>

      {/* ── CTA — appears after arc forms ─────────────────────────────── */}
      {arcVisible && (
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="pointer-events-none absolute top-[8%] inset-x-0 z-20 flex flex-col items-center justify-center text-center px-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-3">
            {text.tag}
          </p>
          <h2 className="text-3xl font-black text-white sm:text-5xl mb-3">
            {text.titleA}{' '}
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
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
      )}

      {/* ── Cards ─────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center w-full h-full">
        {IMAGES.map((src, i) => {
          let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

          if (phase === 'scatter') {
            target = scatter[i];
          } else if (phase === 'line') {
            const spacing = 68;
            const total = TOTAL_IMAGES * spacing;
            target = { x: i * spacing - total / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
          } else {
            const isMobile = size.w < 768;
            const minDim = Math.min(size.w, size.h);
            const circleR = Math.min(minDim * 0.35, 350);
            const circleAngle = (i / TOTAL_IMAGES) * 360;
            const circleRad   = (circleAngle * Math.PI) / 180;
            const circlePos   = { x: Math.cos(circleRad) * circleR, y: Math.sin(circleRad) * circleR, rotation: circleAngle + 90 };

            const baseR  = Math.min(size.w, size.h * 1.5);
            const arcR   = baseR * (isMobile ? 1.4 : 1.1);
            const apexY  = size.h * (isMobile ? 0.35 : 0.28);
            const arcCY  = apexY + arcR;
            const spread = isMobile ? 100 : 130;
            const start  = -90 - spread / 2;
            const step   = spread / (TOTAL_IMAGES - 1);

            const scrollPct   = Math.min(Math.max(rotate / 360, 0), 1);
            const boundedRot  = -scrollPct * spread * 0.8;
            const curAngle    = start + i * step + boundedRot;
            const arcRad      = (curAngle * Math.PI) / 180;
            const arcPos = {
              x: Math.cos(arcRad) * arcR + px,
              y: Math.sin(arcRad) * arcR + arcCY,
              rotation: curAngle + 90,
              scale: isMobile ? 1.4 : 1.8,
            };

            const t = phase === 'arc' ? morph : 0;
            target = {
              x: lerp(circlePos.x, arcPos.x, t),
              y: lerp(circlePos.y, arcPos.y, t),
              rotation: lerp(circlePos.rotation, arcPos.rotation, t),
              scale: lerp(1, arcPos.scale, t),
              opacity: 1,
            };
          }

          return <FlipCard key={i} src={src} index={i} target={target} />;
        })}
      </div>

      {/* Bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(to top, #030712, transparent)' }} />
    </div>
  );
}
