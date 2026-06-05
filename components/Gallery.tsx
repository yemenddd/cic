'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import InfiniteGallery from '@/components/ui/infinite-gallery';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const GALLERY_IMAGES = [
  '/images/gallery/feature.jpg',
  '/images/experience/1.jpg',
  '/images/experience/2.jpg',
  '/images/gallery/bg2.jpg',
  '/images/experience/3.jpg',
  '/images/experience/4.jpg',
  '/images/experience/5.jpg',
  '/images/conf_keynote.png',
  '/images/conf_networking.png',
];

export default function Gallery() {
  const { t, dir } = useLang();
  const isRtl = dir === 'rtl';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
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
      
      <audio ref={audioRef} src="/music/gallery.mp3" loop />

      {/* Audio Toggle Button */}
      <div className={`absolute top-28 z-30 ${isRtl ? 'left-6' : 'right-6'}`}>
        <button
          onClick={toggleAudio}
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
          aria-label="Toggle music"
        >
          {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
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
        visibleCount={10}
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
