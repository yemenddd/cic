'use client';

import { motion } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import InfiniteGallery from '@/components/ui/infinite-gallery';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

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
