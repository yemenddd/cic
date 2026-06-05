'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Lazy-load the heavy 3D WebGL gallery — only fetched when this page is visited
const InfiniteGallery = dynamic(() => import('@/components/ui/infinite-gallery'), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-[#030712]" />,
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

export default function Gallery() {
  const { t, dir } = useLang();
  const isRtl = dir === 'rtl';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // Lower music volume
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false)); // Browser autoplay policy might block this
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
    <section id="gallery" className="relative bg-[#030712] min-h-screen overflow-hidden">
      
      <audio ref={audioRef} src="/music/gallery.m4a" loop />

      {/* Audio Toggle Button */}
      <div className={`absolute top-28 z-30 ${isRtl ? 'left-6' : 'right-6'}`}>
        <motion.button
          onClick={toggleAudio}
          aria-label="Toggle music"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: isPlaying
              ? '0 0 24px rgba(96,165,250,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 0 0px rgba(0,0,0,0), inset 0 1px 0 rgba(255,255,255,0.05)',
            transition: 'box-shadow 0.4s ease',
          }}
        >
          {/* Rotating gradient ring when playing */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #67e8f9, #60a5fa, #8b5cf6, #67e8f9)',
                opacity: 0.25,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* Icon — equalizer bars when playing, mute icon when paused */}
          <div className="relative z-10 flex items-end justify-center gap-[3px] h-5">
            {isPlaying ? (
              <>
                {[0.5, 1, 0.7, 1.2, 0.4].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-[3px] rounded-full"
                    style={{ background: 'linear-gradient(to top, #60a5fa, #c4b5fd)' }}
                    animate={{ scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: delay * 0.18, ease: 'easeInOut' }}
                    initial={{ scaleY: 0.3, height: 20, originY: 1 }}
                  />
                ))}
              </>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </div>
        </motion.button>
      </div>

      {/* Centered title overlay */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-36 pointer-events-none" dir={isRtl ? 'rtl' : 'ltr'}>
        <motion.h1
          className="font-outfit font-bold leading-[0.9] tracking-tight text-center text-white"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('gallery.titleA')}{' '}
          <span className="inline-block py-[0.15em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
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
        style={{ background: 'linear-gradient(to top, #030712, transparent)' }}
      />
    </section>
  );
}
