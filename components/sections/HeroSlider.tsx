'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';

const INTERVAL = 6000;
const EASE = [0.16, 1, 0.3, 1] as const;

const SLIDES = [
  {
    image: '/images/gallery/DSC02311-Pano.jpg',
    tagAr:      'إسطنبول · 2026',
    tagEn:      'Istanbul · 2026',
    headlineAr: 'المؤتمر الدولي\nلتكنولوجيا المعلومات',
    headlineEn: 'International Conference\non ICT',
    subtitleAr: 'التقنية، الابتكار، والمستقبل في مكان واحد',
    subtitleEn: 'Technology, Innovation & the Future — in one place',
  },
  {
    image: '/images/gallery/DSC06230-Pano.jpg',
    tagAr:      'صنعاء · أكتوبر 2026',
    tagEn:      "Sana'a · October 2026",
    headlineAr: 'حيث تلتقي\nالعقول بالآلة',
    headlineEn: 'Where Minds\nMeet Machines',
    subtitleAr: '+500 مشارك من مختلف القطاعات والتخصصات',
    subtitleEn: '500+ attendees from across all sectors and disciplines',
  },
  {
    image: '/images/gallery/bg2.jpg',
    tagAr:      'ورش عمل · معارض · مسابقات',
    tagEn:      'Workshops · Exhibitions · Competitions',
    headlineAr: 'تجربة استثنائية\nلا تُنسى',
    headlineEn: 'An Extraordinary\nConference Experience',
    subtitleAr: 'تعلّم من الأفضل وتواصل مع رواد المجال',
    subtitleEn: 'Learn from the best and connect with industry leaders',
  },
  {
    image: '/images/gallery/feature.jpg',
    tagAr:      'المقاعد محدودة',
    tagEn:      'Limited Seats Available',
    headlineAr: 'انضم إلى رواد\nالتكنولوجيا',
    headlineEn: 'Join the\nTech Pioneers',
    subtitleAr: 'سجّل مبكراً واضمن مكانك في الحدث التقني الأبرز',
    subtitleEn: 'Register early and secure your place at the premier tech event',
  },
];

export default function HeroSlider() {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';
  const [current, setCurrent] = useState(0);
  const [tick, setTick] = useState(0); // bumped on any navigation → resets timer + progress

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setTick(t => t + 1);
  }, []);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % SLIDES.length);
    setTick(t => t + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length);
    setTick(t => t + 1);
  }, []);

  // Auto-advance
  useEffect(() => {
    const id = setTimeout(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
      setTick(t => t + 1);
    }, INTERVAL);
    return () => clearTimeout(id);
  }, [tick]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100svh', minHeight: 560 }}
    >

      {/* ── Background image with Ken Burns ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current}`}
          className="absolute inset-0"
          initial={{ scale: 1.07, opacity: 0 }}
          animate={{ scale: 1.0,  opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            scale:   { duration: INTERVAL / 1000 + 1, ease: 'linear' },
            opacity: { duration: 0.9, ease: 'easeInOut' },
          }}
          style={{
            backgroundImage:    `url(${slide.image})`,
            backgroundSize:     'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* ── Dark gradient overlay ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.84) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-20 flex flex-col justify-end h-full pb-20"
        style={{ paddingInline: 'clamp(24px, 5vw, 80px)' }}
        dir={dir}
      >

        {/* Slide text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${current}`}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -10 }}
            transition={{ duration: 0.62, ease: EASE }}
            className="flex flex-col items-center text-center mx-auto max-w-3xl w-full"
          >
            {/* Headline */}
            <h2
              className="mb-5 font-black leading-tight"
              style={{
                fontFamily: isRtl ? 'var(--font-thmanyah)' : 'var(--font-outfit)',
                fontSize:   'clamp(2.25rem, 5.5vw, 4.75rem)',
                color:      '#ffffff',
                whiteSpace: 'pre-line',
                textShadow: '0 2px 24px rgba(0,0,0,0.4)',
                lineHeight: 1.08,
              }}
            >
              {isRtl ? slide.headlineAr : slide.headlineEn}
            </h2>

            {/* Subtitle */}
            <p
              className="mb-9 font-medium leading-relaxed max-w-lg"
              style={{
                fontSize: 'clamp(0.875rem, 1.7vw, 1.0625rem)',
                color:    'rgba(255,255,255,0.65)',
              }}
            >
              {isRtl ? slide.subtitleAr : slide.subtitleEn}
            </p>

            {/* CTA */}
            <Link
              href="/register"
              className="font-bold transition-opacity duration-200 hover:opacity-80"
              style={{
                background:     '#ffffff',
                color:          '#0d0d0f',
                padding:        '13px 28px',
                borderRadius:   50,
                fontSize:       15,
                textDecoration: 'none',
                display:        'inline-block',
              }}
            >
              {isRtl ? 'سجّل الآن' : 'Register Now'}
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom nav bar — always LTR layout so arrows never flip ── */}
        <div className="flex items-center justify-between mt-10" dir="ltr">

          {/* Progress pills */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative overflow-hidden flex-shrink-0"
                aria-label={`Slide ${i + 1}`}
                style={{
                  width:      i === current ? 32 : 8,
                  height:     4,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,0.22)',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    0,
                  transition: 'width 0.35s ease',
                }}
              >
                {i === current && (
                  <motion.span
                    key={tick}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: '#ffffff' }}
                    initial={{ width: '0%'   }}
                    animate={{ width: '100%' }}
                    transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Arrow buttons */}
          <div className="flex items-center gap-2">
            {[
              { icon: ChevronLeft,  action: prev, label: 'Previous' },
              { icon: ChevronRight, action: next, label: 'Next'     },
            ].map(({ icon: Icon, action, label }) => (
              <button
                key={label}
                onClick={action}
                aria-label={label}
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.10)',
                  border:     '1px solid rgba(255,255,255,0.18)',
                  color:      '#ffffff',
                  cursor:     'pointer',
                  display:    'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)')}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
