'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Lazy-load the heavy 3D WebGL gallery — only fetched when this page is visited
const InfiniteGallery = dynamic(() => import('@/components/ui/infinite-gallery'), {
  ssr: false,
  loading: () => <div className="w-full h-screen" style={{ background: 'var(--bg-base)' }} />,
});

const GALLERY_IMAGES = [
  "/images/gallery/DSC02311-Pano.jpg",
  "/images/gallery/DSC02581.jpg",
  "/images/gallery/DSC06161.jpg",
  "/images/gallery/DSC06230-Pano.jpg",
  "/images/gallery/DSC08020 - 1.jpg",
  "/images/gallery/DSC_0949.JPG",
  "/images/gallery/نسخة من DSC001721 (26).JPG",
  "/images/gallery/نسخة من DSC001721 (38).JPG",
  "/images/gallery/نسخة من DSC001721 (73).JPG",
  "/images/gallery/نسخة من DSC00201.jpg",
  "/images/gallery/نسخة من DSC00334.jpg",
  "/images/gallery/نسخة من DSC00365-Pano-2.jpg",
  "/images/gallery/نسخة من DSC00536.jpg",
  "/images/gallery/نسخة من DSC00631.jpg",
  "/images/gallery/نسخة من DSC00709-Pano.jpg",
  "/images/gallery/نسخة من DSC00721.jpg",
  "/images/gallery/نسخة من DSC00740.jpg",
  "/images/gallery/نسخة من DSC00746.jpg",
  "/images/gallery/نسخة من DSC00756-Pano.jpg",
  "/images/gallery/نسخة من DSC00813.jpg",
  "/images/gallery/نسخة من DSC06819.jpg",
  "/images/gallery/نسخة من DSC07197-Pano.jpg",
  "/images/gallery/نسخة من DSC07226.jpg",
  "/images/gallery/نسخة من DSC07350.jpg",
  "/images/gallery/نسخة من DSC07428.jpg",
  "/images/gallery/نسخة من DSC08369.JPG",
  "/images/gallery/نسخة من DSC09376.jpg",
  "/images/gallery/نسخة من DSC09411.jpg",
  "/images/gallery/نسخة من DSC09499.jpg",
  "/images/gallery/نسخة من DSC09642.jpg",
  "/images/gallery/نسخة من DSC09688.jpg",
  "/images/gallery/نسخة من DSC09719.jpg",
  "/images/gallery/نسخة من DSC09780.JPG",
  "/images/gallery/نسخة من DSC09806.jpg",
  "/images/gallery/نسخة من DSC09814-Pano.jpg",
  "/images/gallery/نسخة من DSC09836.jpg",
];

const MUSIC: Record<string, string> = {
  ar: '/music/5abaya_final_ar.wav',
  tr: '/music/Ymenddd_tr.mp3',
  en: '/music/gallery_en.m4a',
};

export default function Gallery() {
  const { t, dir, lang } = useLang();
  const isRtl = dir === 'rtl';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const src = MUSIC[lang] ?? MUSIC.en;

  // When language changes, reload the audio at the same play state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    audio.pause();
    audio.load();
    audio.volume = 0.1;
    if (wasPlaying) audio.play().catch(() => {});
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section id="gallery" className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      
      <audio ref={audioRef} src={src} loop />

      {/* Audio Toggle Button */}
      <div className={`absolute top-28 z-30 ${isRtl ? 'left-6' : 'right-6'}`}>
        <motion.button
          onClick={toggleAudio}
          aria-label="Toggle music"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--mat-liquid-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--mat-liquid-border)',
            transition: 'border-color 0.3s ease',
          }}
        >
          <motion.svg
            key={isPlaying ? 'on' : 'off'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={isPlaying ? 'var(--text-primary)' : 'var(--text-tertiary)'}
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {isPlaying ? (
              <>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            ) : (
              <>
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </motion.svg>
        </motion.button>
      </div>

      {/* Centered title overlay */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-36 pointer-events-none" dir={isRtl ? 'rtl' : 'ltr'}>
        <motion.h1
          className="font-outfit font-bold leading-[0.9] tracking-tight text-center"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('gallery.titleA')}{' '}
          <span className="inline-block gradient-text py-[0.15em] leading-[1.1]">
            {t('gallery.titleB')}
          </span>
        </motion.h1>
      </div>

      {/* 3D infinite gallery */}
      <InfiniteGallery
        images={GALLERY_IMAGES}
        className="w-full h-screen"
        speed={1}
        visibleCount={8}
        fadeSettings={{ fadeIn: { start: 0.05, end: 0.25 }, fadeOut: { start: 0.4, end: 0.43 } }}
        blurSettings={{ blurIn: { start: 0.0, end: 0.1 }, blurOut: { start: 0.4, end: 0.43 }, maxBlur: 8.0 }}
      />

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 z-10"
        style={{ background: 'linear-gradient(to top, var(--bg-base), transparent)' }}
      />
    </section>
  );
}
