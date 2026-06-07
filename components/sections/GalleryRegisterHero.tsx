"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────────
type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
  src: string;
  index: number;
  total: number;
  phase: AnimationPhase;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// ── Card dimensions ──────────────────────────────────────────────────────────
const IMG_WIDTH  = 60;
const IMG_HEIGHT = 85;

function FlipCard({ src, index, target }: FlipCardProps) {
  return (
    <motion.div
      animate={{ x: target.x, y: target.y, rotate: target.rotation, scale: target.scale, opacity: target.opacity }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{ position: "absolute", width: IMG_WIDTH, height: IMG_HEIGHT, transformStyle: "preserve-3d", perspective: "1000px" }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front */}
        <div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-xl bg-white/5"
          style={{ backfaceVisibility: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`photo-${index}`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-transparent" />
          <div className="absolute inset-0 rounded-xl" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-xl bg-[#0d0d1a] flex flex-col items-center justify-center p-3 border border-white/10"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-center">
            <p className="text-[7px] font-bold text-cyan-400 uppercase tracking-widest mb-1">CICT</p>
            <p className="text-[10px] font-medium text-white/80">2026</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Conference images (20 photos from gallery) ───────────────────────────────
const IMAGES = [
  "/images/gallery/DSC02311-Pano.jpg",
  "/images/gallery/DSC02581.jpg",
  "/images/gallery/DSC06161.jpg",
  "/images/gallery/DSC06230-Pano.jpg",
  "/images/gallery/DSC_0949.JPG",
  "/images/gallery/bg2.jpg",
  "/images/gallery/feature.jpg",
  "/images/gallery/نسخة من DSC001721 (26).JPG",
  "/images/gallery/نسخة من DSC001721 (38).JPG",
  "/images/gallery/نسخة من DSC001721 (73).JPG",
  "/images/gallery/نسخة من DSC00201.jpg",
  "/images/gallery/نسخة من DSC00334.jpg",
  "/images/gallery/نسخة من DSC00536.jpg",
  "/images/gallery/نسخة من DSC00631.jpg",
  "/images/gallery/نسخة من DSC00721.jpg",
  "/images/gallery/نسخة من DSC00740.jpg",
  "/images/gallery/نسخة من DSC07350.jpg",
  "/images/gallery/نسخة من DSC09376.jpg",
  "/images/gallery/نسخة من DSC09499.jpg",
  "/images/gallery/نسخة من DSC09642.jpg",
];

const TOTAL_IMAGES = 20;
const MAX_SCROLL   = 3000;
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ── Main component ────────────────────────────────────────────────────────────
export default function GalleryRegisterHero() {
  const { lang, dir } = useLang();
  const isRtl = dir === "rtl";

  const copy = {
    intro:    lang === "ar" ? "معًا نبني المستقبل." : lang === "tr" ? "Geleceği birlikte inşa ediyoruz." : "Together we build the future.",
    scroll:   lang === "ar" ? "مرّر لاستعراض اللحظات" : lang === "tr" ? "ANları keşfetmek için kaydır" : "Scroll to explore moments",
    title:    lang === "ar" ? "كن جزءًا من الحدث" : lang === "tr" ? "Etkinliğin parçası ol" : "Be part of the event",
    sub:      lang === "ar"
      ? "أكثر من 500 مبدع ومبتكر في مكان واحد. انضم إلينا في مؤتمر الإبداع والابتكار 2026."
      : lang === "tr"
      ? "500'den fazla yaratıcı ve yenilikçi tek bir çatı altında. CICT 2026'ya katılın."
      : "500+ creators and innovators in one place. Join us at CICT 2026.",
    cta:      lang === "ar" ? "سجّل الآن" : lang === "tr" ? "Kayıt Ol" : "Register Now",
    date:     lang === "ar" ? "15–16 أغسطس 2026 · إسطنبول" : lang === "tr" ? "15–16 Ağustos 2026 · İstanbul" : "Aug 15–16, 2026 · Istanbul",
  };

  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries)
        setContainerSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    obs.observe(containerRef.current);
    setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // Virtual scroll
  const virtualScroll = useMotionValue(0);
  const scrollRef     = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      const next = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [virtualScroll]);

  const morphProgress     = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph       = useSpring(morphProgress, { stiffness: 40, damping: 20 });
  const scrollRotate      = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothScrollRotate= useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  // Mouse parallax
  const mouseX      = useMotionValue(0);
  const smoothMouseX= useSpring(mouseX, { stiffness: 30, damping: 20 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width * 2 - 1) * 100);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mouseX]);

  // Intro sequence
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase("line"),   500);
    const t2 = setTimeout(() => setIntroPhase("circle"), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const scatterPositions = useMemo(() =>
    IMAGES.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    })), []);

  const [morphValue,    setMorphValue]    = useState(0);
  const [rotateValue,   setRotateValue]   = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    const u1 = smoothMorph.on("change", setMorphValue);
    const u2 = smoothScrollRotate.on("change", setRotateValue);
    const u3 = smoothMouseX.on("change", setParallaxValue);
    return () => { u1(); u2(); u3(); };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY       = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  return (
    <section className="relative w-full h-screen bg-[#030712] overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 80%, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />

        {/* Intro text */}
        <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2 inset-x-0">
          <motion.h2
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={introPhase === "circle" && morphValue < 0.5
              ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" }
              : { opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className="text-2xl font-bold tracking-tight text-white md:text-4xl"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {copy.intro}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={introPhase === "circle" && morphValue < 0.5
              ? { opacity: 0.4 - morphValue * 0.8 }
              : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-4 text-[11px] font-semibold tracking-[0.25em] text-white/40 uppercase"
          >
            {copy.scroll}
          </motion.p>
        </div>

        {/* CTA content — fades in when arc forms */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute top-[8%] z-20 flex flex-col items-center justify-center text-center pointer-events-none px-6 inset-x-0"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            {copy.title}
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-md leading-relaxed mb-6">
            {copy.sub}
          </p>
          <p className="text-xs text-white/30 mb-5 tracking-widest">{copy.date}</p>

          {/* Register button — pointer-events re-enabled */}
          <motion.div style={{ pointerEvents: 'auto' }}>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}
            >
              {copy.cta}
              <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Image carousel */}
        <div className="relative flex items-center justify-center w-full h-full">
          {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const spacing   = 70;
              const totalW    = TOTAL_IMAGES * spacing;
              target = { x: i * spacing - totalW / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              const isMobile    = containerSize.width < 768;
              const minDim      = Math.min(containerSize.width, containerSize.height);
              const circleR     = Math.min(minDim * 0.35, 350);
              const circleAngle = (i / TOTAL_IMAGES) * 360;
              const circleRad   = (circleAngle * Math.PI) / 180;
              const circlePos   = {
                x: Math.cos(circleRad) * circleR,
                y: Math.sin(circleRad) * circleR,
                rotation: circleAngle + 90,
              };

              const baseR       = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcR        = baseR * (isMobile ? 1.4 : 1.1);
              const arcApexY    = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY  = arcApexY + arcR;
              const spread      = isMobile ? 100 : 130;
              const startAngle  = -90 - spread / 2;
              const step        = spread / (TOTAL_IMAGES - 1);
              const scrollProg  = Math.min(Math.max(rotateValue / 360, 0), 1);
              const bounded     = -scrollProg * spread * 0.8;
              const curAngle    = startAngle + i * step + bounded;
              const arcRad      = (curAngle * Math.PI) / 180;
              const arcPos = {
                x: Math.cos(arcRad) * arcR + (isRtl ? -parallaxValue : parallaxValue),
                y: Math.sin(arcRad) * arcR + arcCenterY,
                rotation: curAngle + 90,
                scale: isMobile ? 1.4 : 1.8,
              };

              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return (
              <FlipCard key={i} src={src} index={i} total={TOTAL_IMAGES} phase={introPhase} target={target} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
