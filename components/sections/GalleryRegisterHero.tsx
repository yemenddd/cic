'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
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
const IMG_W = 64;
const IMG_H = 90;

/** Returns translateX, translateY (both relative to container centre), rotate, scale */
function calcCard(i: number, m: number, hw: number, hh: number) {
  const isMobile  = hw * 2 < 768;
  // Full-screen circle: radius reaches near the top/bottom edges
  const circleR   = isMobile ? Math.min(hw * 0.85, hh * 0.78) : Math.min(hw * 0.52, hh * 0.78);
  const arcR      = isMobile ? Math.min(hw * 0.85, 300) : Math.min(hw * 0.52, 400);
  const arcOffY   = isMobile ? 80 : 110;   // top-of-arc below centre
  const spread    = isMobile ? 110 : 140;
  const startA    = -90 - spread / 2;

  // Circle (tx, ty relative to centre)
  const cAngle = (i / TOTAL) * Math.PI * 2;
  const ctx    = Math.cos(cAngle) * circleR;
  const cty    = Math.sin(cAngle) * circleR;
  const cRot   = (i / TOTAL) * 360 + 90;

  // Arc bottom-fan (tx, ty relative to centre)
  const aAngleDeg = startA + (i / (TOTAL - 1)) * spread;
  const aAngle    = aAngleDeg * (Math.PI / 180);
  const atx       = Math.cos(aAngle) * arcR;
  // arc centre sits arcOffY + arcR below screen centre  →  card.y = arcOffY + arcR + sin(angle)*arcR
  const aty       = arcOffY + arcR + Math.sin(aAngle) * arcR;
  const aRot      = aAngleDeg + 90;
  const aScale    = isMobile ? 1.3 : 1.6;

  // Lerp
  const tx    = ctx    + (atx    - ctx)    * m;
  const ty    = cty    + (aty    - cty)    * m;
  const rot   = cRot   + (aRot   - cRot)   * m;
  const scale = 1      + (aScale - 1)      * m;
  return { tx, ty, rot, scale };
}

// ── Card component (hover = flip) ────────────────────────────────────────────
const Card = ({ src, elRef }: { src: string; elRef: (el: HTMLDivElement | null) => void }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      ref={elRef}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{
        position: 'absolute',
        left: '50%', top: '50%',
        marginLeft: -IMG_W / 2, marginTop: -IMG_H / 2,
        width: IMG_W, height: IMG_H,
        perspective: '800px',
        willChange: 'transform',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Front */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.6)', outline: '1px solid rgba(255,255,255,0.08)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        {/* Back */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 12, transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#67e8f9', textTransform: 'uppercase', marginBottom: 2 }}>CICT</p>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>2026</p>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GalleryRegisterHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Page-scroll → morph ──────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start start', 'end end'] });
  const morphRaw = useTransform(scrollYProgress, [0.18, 0.62], [0, 1]);
  const morph    = useSpring(morphRaw, { stiffness: 60, damping: 22 });

  // ── Update card DOM directly on every morph tick (no React re-render) ────────
  useMotionValueEvent(morph, 'change', (m) => {
    const el = innerRef.current;
    if (!el) return;
    const hw = el.offsetWidth  / 2;
    const hh = el.offsetHeight / 2;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const { tx, ty, rot, scale } = calcCard(i, m, hw, hh);
      card.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    });
  });

  // Initial placement on mount
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const hw = el.offsetWidth  / 2;
    const hh = el.offsetHeight / 2;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const { tx, ty, rot, scale } = calcCard(i, 0, hw, hh);
      card.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    });
  }, []);

  // CTA is always visible — same position in both circle and arc phases
  const ctaOp = useTransform(morph, [0, 0.15], [0, 1]);
  const ctaY  = useTransform(morph, [0, 0.15], [16, 0]);

  const text = {
    tag:    lang === 'ar' ? 'انضم إلى المؤتمر'          : lang === 'tr' ? 'Konferansa Katıl'  : 'Join the Conference',
    titleA: lang === 'ar' ? 'احجز مقعدك '               : lang === 'tr' ? 'Yerinizi '         : 'Secure your ',
    titleB: lang === 'ar' ? 'قبل نفاد الأماكن'          : lang === 'tr' ? 'Şimdi Ayırın'      : 'seat now.',
    sub:    lang === 'ar' ? 'يومان من الإلهام — كن جزءًا من اللحظة.' : lang === 'tr' ? 'İki gün ilham — bu anın parçası ol.' : 'Two days of inspiration — be part of the moment.',
    btn:    lang === 'ar' ? 'سجّل الآن'                 : lang === 'tr' ? 'Kayıt Ol'          : 'Register Now',
  };

  return (
    <div ref={outerRef} style={{ height: '220vh' }}>
      <div
        ref={innerRef}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="sticky top-0 w-full bg-[#030712]"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(ellipse,#7c3aed 0%,#06b6d4 60%,transparent 100%)' }} />
        </div>

        {/* Registration CTA — always at top, visible in both circle and arc */}
        <motion.div
          style={{ opacity: ctaOp, y: ctaY }}
          className="pointer-events-none absolute top-[8%] inset-x-0 z-20 flex flex-col items-center text-center px-6"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70 mb-3">{text.tag}</p>
          <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem,4vw,3.5rem)' }}>
            {text.titleA}
            <span style={{ background: 'linear-gradient(135deg,#06b6d4,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {text.titleB}
            </span>
          </h2>
          <p className="text-sm text-white/40 max-w-sm mb-7 leading-relaxed">{text.sub}</p>
          <div className="pointer-events-auto">
            <Link href="/register"
              className={cn('inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.97] transition-all', isRtl && 'flex-row-reverse')}
              style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6,#8b5cf6)' }}>
              {text.btn}
              <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            </Link>
          </div>
        </motion.div>

        {/* Cards — DOM updated directly, no React re-renders */}
        <div className="absolute inset-0">
          {IMAGES.map((src, i) => (
            <Card key={i} src={src} elRef={(el) => { cardRefs.current[i] = el; }} />
          ))}
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: 'linear-gradient(to top,#030712,transparent)' }} />
      </div>
    </div>
  );
}
