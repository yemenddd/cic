'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLang } from '@/lib/i18n';

const media = [
  { src: '/images/experience/1.jpg', n: '01' },
  { src: '/images/experience/2.jpg', n: '02' },
  { src: '/images/experience/3.jpg', n: '03' },
  { src: '/images/experience/4.jpg', n: '04' },
  { src: '/images/experience/5.jpg', n: '05' },
];

export default function HorizontalGallery() {
  const { t, tx, dir } = useLang();
  const isRtl = dir === 'rtl';
  const panelText = tx<{ tag: string; title: string }[]>('experience.panels');
  const panels = media.map((m, i) => ({ ...m, ...panelText[i] }));
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollRange, setScrollRange] = useState(0);

  useEffect(() => {
    const update = () => {
      if (trackRef.current) {
        // Calculate the exact pixel difference between the content width and the viewport width
        setScrollRange(trackRef.current.scrollWidth - trackRef.current.clientWidth);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Drive the horizontal track precisely using the exact pixel measurements
  const x = useTransform(scrollYProgress, [0, 1], isRtl ? [0, scrollRange] : [0, -scrollRange]);
  // Header parallax — drifts smoothly towards the center as you scroll to the last photo
  const headerX = useTransform(scrollYProgress, [0, 1], isRtl ? ['0%', '-50%'] : ['0%', '50%']);

  return (
    <section ref={sectionRef} className="relative h-[250vh] md:h-[320vh]" style={{ background: 'var(--bg-base)' }}>
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <motion.div
          style={{ x: headerX }}
          className="px-6 lg:px-16 pt-24 lg:pt-28 pb-6 shrink-0"
        >

          <h2
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`font-outfit font-bold tracking-tight leading-[0.92] ${isRtl ? 'text-right' : ''}`}
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 5rem)' }}
          >
            <span
              style={{
                background:           'linear-gradient(180deg, #FFFFFF 0%, #A2A2A6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }}
            >
              {t('experience.titleA')}
            </span>
            {' '}
            <span className="inline-block gradient-text py-[0.15em]">{t('experience.titleB')}</span>
          </h2>
        </motion.div>

        {/* ── Horizontal track ── */}
        <div ref={trackRef} className="flex-1 flex items-center min-h-0 w-full overflow-hidden">
          <motion.div
            style={{ x }}
            className="flex gap-5 lg:gap-7 px-6 lg:px-16 will-change-transform w-max"
          >
            {panels.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group relative shrink-0 overflow-hidden rounded-3xl"
                style={{
                  width:      'clamp(280px, 78vw, 540px)',
                  height:     'min(62vh, 600px)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                  boxShadow:  '0 8px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
                  transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <Image
                  src={p.src}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 78vw, 540px"
                />

                {/* Cinematic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                {/* Number — top right */}
                <span
                  className="absolute top-5 right-6 font-outfit font-bold text-2xl tabular-nums"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  {p.n}
                </span>

                {/* Liquid glass tag chip */}
                <div
                  className="absolute top-5 left-5 px-3 py-1.5 rounded-full text-[10.5px] font-semibold"
                  style={{
                    background:           'rgba(15,15,18,0.72)',
                    backdropFilter:       'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border:               '1px solid rgba(255,255,255,0.10)',
                    boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.08)',
                    color:                'rgba(255,255,255,0.80)',
                    letterSpacing:        '0.04em',
                  }}
                >
                  {p.tag}
                </div>

                {/* Caption */}
                <div className={`absolute inset-x-0 bottom-0 p-7 ${isRtl ? 'text-right' : ''}`}>
                  <h3
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className="font-outfit font-bold text-2xl leading-tight"
                    style={{
                      background:           'linear-gradient(180deg, #FFFFFF 0%, #C0C0C4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor:  'transparent',
                      backgroundClip:       'text',
                    }}
                  >
                    {p.title}
                  </h3>
                  <div
                    className={`mt-3 h-[2px] w-10 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${isRtl ? 'origin-right ml-auto' : 'origin-left'}`}
                    style={{ background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))' }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}

