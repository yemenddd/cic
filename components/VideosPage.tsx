'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Video {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  tag: string;
  featured?: boolean;
}

interface Edition {
  number: string;
  year: string;
  labelAr: string;
  labelEn: string;
  videos: Video[];
}

const EDITIONS: Edition[] = [
  {
    number: '01',
    year: '2023',
    labelAr: 'الانطلاقة الأولى',
    labelEn: 'The First Launch',
    videos: [
      {
        id: 'XMZ4htBi20s',
        titleAr: 'الفيلم الرسمي — الدورة الأولى',
        titleEn: 'Official Film — Edition 1',
        descAr: 'وثائقي انطلاقة المؤتمر الأولى في 2023، يرصد رحلة تأسيس المنصة وأبرز لحظاتها.',
        descEn: 'Documentary of the first edition in 2023, capturing the founding journey and key moments.',
        tag: 'الفيلم الرسمي',
        featured: true,
      },
      {
        id: 'REGcpGlNvC8',
        titleAr: 'ملخص الدورة الأولى',
        titleEn: 'First Edition Highlights',
        descAr: 'أبرز ما جرى في الدورة الأولى من كلمات ونقاشات وتواصل.',
        descEn: 'Best moments from the first edition — talks, panels, and connections.',
        tag: 'ملخص',
      },
    ],
  },
  {
    number: '02',
    year: '2024',
    labelAr: 'آفاق أوسع',
    labelEn: 'Expanding Horizons',
    videos: [
      {
        id: 'REGcpGlNvC8',
        titleAr: 'الفيلم الرسمي — الدورة الثانية',
        titleEn: 'Official Film — Edition 2',
        descAr: 'وثائقي الدورة الثانية الذي يرصد التوسع الوطني والشراكات الجديدة.',
        descEn: 'The documentary of the second edition capturing national expansion and new partnerships.',
        tag: 'الفيلم الرسمي',
        featured: true,
      },
      {
        id: 'XMZ4htBi20s',
        titleAr: 'الكلمة الافتتاحية 2024',
        titleEn: 'Opening Keynote 2024',
        descAr: 'الكلمة الافتتاحية الرئيسية للدورة الثانية.',
        descEn: 'The main opening keynote of the second edition.',
        tag: 'كلمة رئيسية',
      },
      {
        id: 'REGcpGlNvC8',
        titleAr: 'ورش العمل التفاعلية',
        titleEn: 'Interactive Workshops',
        descAr: 'تسجيلات ورش العمل التفاعلية من الدورة الثانية.',
        descEn: 'Recordings from the interactive workshops of the second edition.',
        tag: 'ورشة عمل',
      },
    ],
  },
  {
    number: '03',
    year: '2025',
    labelAr: 'أثر عالمي',
    labelEn: 'Global Impact',
    videos: [
      {
        id: 'XMZ4htBi20s',
        titleAr: 'الفيلم الرسمي — مؤتمر 2025',
        titleEn: 'Official Film — CICT 2025',
        descAr: 'الوثائقي الرسمي للدورة الثالثة، يرصد أبرز اللحظات والأثر الذي تركه المؤتمر.',
        descEn: 'The official documentary of the 3rd edition capturing keynotes and lasting impact.',
        tag: 'الفيلم الرسمي',
        featured: true,
      },
      {
        id: 'REGcpGlNvC8',
        titleAr: 'أبرز لحظات مؤتمر 2025',
        titleEn: 'CICT 2025 Highlights',
        descAr: 'مختارات من أكثر اللحظات تأثيراً في الدورة الثالثة.',
        descEn: 'Selected highlights from the most impactful moments of the third edition.',
        tag: 'ملخص',
      },
      {
        id: 'XMZ4htBi20s',
        titleAr: 'جلسات الذكاء الاصطناعي',
        titleEn: 'AI Sessions 2025',
        descAr: 'جلسات الذكاء الاصطناعي والتقنية من مؤتمر 2025.',
        descEn: 'AI and technology sessions from the 2025 conference.',
        tag: 'جلسة',
      },
    ],
  },
  {
    number: '04',
    year: '2026',
    labelAr: 'المستقبل الآن',
    labelEn: 'The Future Is Now',
    videos: [
      {
        id: 'REGcpGlNvC8',
        titleAr: 'التغطية المباشرة — يوم ١',
        titleEn: 'Live Coverage — Day 1',
        descAr: 'التغطية الكاملة لليوم الأول من الدورة الرابعة.',
        descEn: 'Full coverage of Day 1 of the fourth edition.',
        tag: 'بث مباشر',
        featured: true,
      },
      {
        id: 'XMZ4htBi20s',
        titleAr: 'التغطية المباشرة — يوم ٢',
        titleEn: 'Live Coverage — Day 2',
        descAr: 'التغطية الكاملة لليوم الثاني من الدورة الرابعة.',
        descEn: 'Full coverage of Day 2 of the fourth edition.',
        tag: 'بث مباشر',
      },
    ],
  },
];

/* ── Video card ── */
function VideoCard({ video, index, isRtl, onPlay }: { video: Video; index: number; isRtl: boolean; onPlay: (id: string) => void }) {
  return (
    <motion.div
      className={`group cursor-pointer ${video.featured ? 'md:col-span-2' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: EASE }}
      onClick={() => onPlay(video.id)}
    >
      <div className="relative overflow-hidden rounded-2xl mb-3 aspect-video">
        <img
          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
          alt={isRtl ? video.titleAr : video.titleEn}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(to right,#06b6d4,#3b82f6,#8b5cf6)', boxShadow: '0 0 28px rgba(96,165,250,0.45)' }}
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
          >
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </motion.div>
        </div>

        {/* Badge */}
        <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`}>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: 'linear-gradient(to right,rgba(6,182,212,0.85),rgba(139,92,246,0.85))', backdropFilter: 'blur(8px)' }}>
            {video.tag}
          </span>
        </div>
      </div>

      <div dir={isRtl ? 'rtl' : 'ltr'}>
        <h3 className="font-outfit font-bold text-white text-[15px] md:text-base mb-1 group-hover:text-blue-300 transition-colors line-clamp-1">
          {isRtl ? video.titleAr : video.titleEn}
        </h3>
        <p className="text-[12px] md:text-[13px] text-white/40 leading-relaxed line-clamp-2">
          {isRtl ? video.descAr : video.descEn}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function VideosPage() {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';
  const [activeEdition, setActiveEdition] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const edition = EDITIONS[activeEdition];

  return (
    <section className="relative min-h-screen bg-[#030712] overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(96,165,250,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-16 md:pb-24 w-full">

        {/* Page title */}
        <div className="mb-10 md:mb-12">
          <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-4"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 5rem)' }}>
            <motion.span className="block text-white"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: EASE }}>
              {isRtl ? 'الأفلام' : 'Films &'}
            </motion.span>
            <motion.span
              className="block py-[0.2em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: EASE }}>
              {isRtl ? 'والوثائقيات.' : 'Documentaries.'}
            </motion.span>
          </h1>
          <motion.p className="text-white/40 max-w-lg text-sm md:text-base leading-relaxed"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}>
            {isRtl
              ? 'تصفّح مقاطع الفيديو والأفلام الرسمية لكل دورة من دورات المؤتمر.'
              : 'Browse videos and official films from every conference edition.'}
          </motion.p>
        </div>

        {/* Edition tabs */}
        <motion.div
          className="flex gap-2 md:gap-3 mb-10 md:mb-12 flex-wrap"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          {EDITIONS.map((ed, i) => (
            <button
              key={ed.number}
              onClick={() => setActiveEdition(i)}
              className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full text-[12px] md:text-[13px] font-semibold transition-all duration-300"
              style={activeEdition === i ? {
                background: 'linear-gradient(to right,#06b6d4,#3b82f6,#8b5cf6)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(96,165,250,0.3)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              <span className="font-mono opacity-60">{ed.number}</span>
              <span>{isRtl ? ed.labelAr : ed.labelEn}</span>
              <span className="opacity-40">{ed.year}</span>
            </button>
          ))}
        </motion.div>

        {/* Edition content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEdition}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* Edition header */}
            <div className="flex items-center gap-4 mb-8" dir={isRtl ? 'rtl' : 'ltr'}>
              <span className="font-mono text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {edition.year}
              </span>
              <h2 className="font-outfit font-bold text-white text-lg md:text-xl">
                {isRtl ? edition.labelAr : edition.labelEn}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[12px] text-white/30 shrink-0">
                {edition.videos.length} {isRtl ? 'مقاطع' : 'videos'}
              </span>
            </div>

            {/* Videos grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
              {edition.videos.map((video, i) => (
                <VideoCard key={i} video={video} index={i} isRtl={isRtl} onPlay={setActiveVideo} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Video Modal ── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            key="modal"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setActiveVideo(null)}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} />
            <button onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <X size={17} />
            </button>
            <motion.div
              className="relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
              style={{ border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.32, ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              <iframe width="100%" height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="CICT Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen className="w-full h-full" style={{ border: 'none' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
