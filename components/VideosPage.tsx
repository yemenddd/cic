'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

interface VideoItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  year: string;
  tag: string;
  featured?: boolean;
}

const VIDEOS: VideoItem[] = [
  {
    id: 'XMZ4htBi20s',
    titleAr: 'الفيلم الرسمي — مؤتمر 2025',
    titleEn: 'Official Film — CICT 2025',
    descAr: 'الوثائقي الرسمي للدورة الثالثة، يرصد أبرز اللحظات، الكلمات الرئيسية، والأثر الذي تركه المؤتمر.',
    descEn: 'The official documentary of the 3rd edition — capturing keynotes, moments, and the lasting impact of the conference.',
    year: '2025',
    tag: 'الفيلم الرسمي',
    featured: true,
  },
  {
    id: 'REGcpGlNvC8',
    titleAr: 'أبرز لحظات مؤتمر 2025',
    titleEn: 'CICT 2025 Highlights Reel',
    descAr: 'مختارات من أكثر اللحظات تأثيراً وإلهاماً في الدورة الثالثة لمؤتمر الإبداع والابتكار.',
    descEn: 'Selected highlights from the most impactful and inspiring moments of the third edition.',
    year: '2025',
    tag: 'ملخص',
  },
  {
    id: 'REGcpGlNvC8',
    titleAr: 'الكلمة الافتتاحية 2024',
    titleEn: 'Opening Keynote 2024',
    descAr: 'الكلمة الافتتاحية للدورة الثانية التي انطلق فيها المؤتمر نحو الآفاق الوطنية.',
    descEn: 'The opening keynote of the second edition as the conference expanded nationally.',
    year: '2024',
    tag: 'كلمة رئيسية',
  },
  {
    id: 'XMZ4htBi20s',
    titleAr: 'ملخص الدورة الأولى 2023',
    titleEn: 'First Edition Recap 2023',
    descAr: 'نظرة على انطلاقة المؤتمر في دورته الأولى عام 2023 وكيف وضعت الأسس.',
    descEn: 'A look back at how the conference launched in 2023 and laid its foundations.',
    year: '2023',
    tag: 'ملخص',
  },
];

function VideoCard({ video, index, onPlay }: { video: VideoItem; index: number; onPlay: (id: string) => void }) {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';

  return (
    <motion.div
      className={`group cursor-pointer ${video.featured ? 'md:col-span-2' : ''}`}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.6, ease: EASE }}
      onClick={() => onPlay(video.id)}
    >
      {/* Thumbnail */}
      <div className={`relative overflow-hidden rounded-2xl mb-4 ${video.featured ? 'aspect-video' : 'aspect-video'}`}>
        <img
          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
          alt={isRtl ? video.titleAr : video.titleEn}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)', boxShadow: '0 0 32px rgba(96,165,250,0.4)' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={20} fill="white" className="text-white ml-0.5" />
          </motion.div>
        </div>

        {/* Year + tag badge */}
        <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} flex items-center gap-2`}>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {video.year}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'linear-gradient(to right,rgba(6,182,212,0.8),rgba(139,92,246,0.8))', backdropFilter: 'blur(8px)' }}>
            {video.tag}
          </span>
        </div>
      </div>

      {/* Info */}
      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <h3 className={`font-outfit font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors ${video.featured ? 'text-xl' : 'text-base'}`}>
          {isRtl ? video.titleAr : video.titleEn}
        </h3>
        <p className="text-[13px] text-white/45 leading-relaxed line-clamp-2">
          {isRtl ? video.descAr : video.descEn}
        </p>
      </div>
    </motion.div>
  );
}

export default function VideosPage() {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <section className="min-h-screen bg-[#030712]" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-24">

        {/* Header */}
        <div className="mb-14">
          <motion.span
            className="inline-block py-[0.1em] text-[11px] font-semibold uppercase tracking-[0.28em] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent mb-5"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {isRtl ? 'أرشيف الدورات' : 'Edition Archive'}
          </motion.span>

          <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            <motion.span className="block text-white"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: EASE }}>
              {isRtl ? 'الأفلام' : 'Films &'}
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: EASE }}>
              {isRtl ? 'والوثائقيات.' : 'Documentaries.'}
            </motion.span>
          </h1>

          <motion.p
            className="text-white/40 max-w-lg text-base leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}>
            {isRtl
              ? 'الأرشيف الكامل للأفلام الرسمية، الملخصات، والكلمات الرئيسية لكل دورات مؤتمر الإبداع والابتكار.'
              : 'The complete archive of official films, highlight reels, and keynotes from every CICT edition.'}
          </motion.p>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {VIDEOS.map((video, i) => (
            <VideoCard key={i} video={video} index={i} onPlay={setActiveVideo} />
          ))}
        </div>
      </div>

      {/* ── Video Modal ── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            key="modal"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setActiveVideo(null)}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} />
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <X size={17} />
            </button>
            <motion.div
              className="relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
              style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="CICT Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ border: 'none' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
