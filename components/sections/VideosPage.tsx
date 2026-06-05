'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { DynamicFrameLayout } from '@/components/ui/dynamic-frame-layout';
import { X } from 'lucide-react';
import UniversalPlayer from '@/components/ui/video-player';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Video { id: string; titleAr: string; titleEn: string; }

interface Edition {
  number: string;
  year: string;
  labelAr: string;
  labelEn: string;
  videos: Video[];
}

const EDITIONS: Edition[] = [
  {
    number: '01', year: '2023', labelAr: 'الانطلاقة الأولى', labelEn: 'The First Launch',
    videos: [
      { id: 'XMZ4htBi20s', titleAr: 'الفيلم الرسمي — الدورة الأولى', titleEn: 'Official Film — Edition 1' },
      { id: 'REGcpGlNvC8', titleAr: 'ملخص الدورة الأولى', titleEn: 'First Edition Highlights' },
      { id: 'XMZ4htBi20s', titleAr: 'الكلمة الافتتاحية 2023', titleEn: 'Opening Keynote 2023' },
      { id: 'REGcpGlNvC8', titleAr: 'جلسات الابتكار', titleEn: 'Innovation Sessions' },
    ],
  },
  {
    number: '02', year: '2024', labelAr: 'آفاق أوسع', labelEn: 'Expanding Horizons',
    videos: [
      { id: 'REGcpGlNvC8', titleAr: 'الفيلم الرسمي — الدورة الثانية', titleEn: 'Official Film — Edition 2' },
      { id: 'XMZ4htBi20s', titleAr: 'الكلمة الافتتاحية 2024', titleEn: 'Opening Keynote 2024' },
      { id: 'REGcpGlNvC8', titleAr: 'ورش العمل التفاعلية', titleEn: 'Interactive Workshops' },
      { id: 'XMZ4htBi20s', titleAr: 'ملخص الدورة الثانية', titleEn: 'Second Edition Highlights' },
    ],
  },
  {
    number: '03', year: '2025', labelAr: 'أثر عالمي', labelEn: 'Global Impact',
    videos: [
      { id: 'XMZ4htBi20s', titleAr: 'الفيلم الرسمي — مؤتمر 2025', titleEn: 'Official Film — CICT 2025' },
      { id: 'REGcpGlNvC8', titleAr: 'أبرز لحظات مؤتمر 2025', titleEn: 'CICT 2025 Highlights' },
      { id: 'XMZ4htBi20s', titleAr: 'جلسات الذكاء الاصطناعي', titleEn: 'AI Sessions 2025' },
      { id: 'REGcpGlNvC8', titleAr: 'معرض المشاريع 2025', titleEn: 'Projects Exhibition 2025' },
    ],
  },
  {
    number: '04', year: '2026', labelAr: 'المستقبل الآن', labelEn: 'The Future Is Now',
    videos: [
      { id: 'REGcpGlNvC8', titleAr: 'التغطية المباشرة — اليوم الأول', titleEn: 'Live Coverage — Day 1' },
      { id: 'XMZ4htBi20s', titleAr: 'التغطية المباشرة — اليوم الثاني', titleEn: 'Live Coverage — Day 2' },
      { id: 'REGcpGlNvC8', titleAr: 'الكلمات الرئيسية 2026', titleEn: 'Keynotes 2026' },
      { id: 'XMZ4htBi20s', titleAr: 'الحفل الختامي', titleEn: 'Closing Ceremony' },
    ],
  },
];

// Convert edition videos into frames for DynamicFrameLayout (2x2 grid)
const GRID_POSITIONS = [
  { x: 0, y: 0 }, { x: 6, y: 0 },
  { x: 0, y: 6 }, { x: 6, y: 6 },
];

function editionToFrames(edition: Edition) {
  return edition.videos.map((v, i) => ({
    id: i,
    youtubeId: v.id,
    title: v.titleAr,
    defaultPos: { x: GRID_POSITIONS[i % 4].x, y: GRID_POSITIONS[i % 4].y, w: 6, h: 6 },
    corner: '', edgeHorizontal: '', edgeVertical: '',
    mediaSize: 1, borderThickness: 0, borderSize: 100, isHovered: false,
  }));
}

export default function VideosPage() {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';
  const [activeEdition, setActiveEdition] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const edition = EDITIONS[activeEdition];
  const frames = editionToFrames(edition);

  return (
    <section className="relative min-h-screen bg-[#030712] overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-10 w-full">

        {/* Title */}
        <div className="mb-8 md:mb-10">
          <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 4.5rem)' }}>
            <motion.span className="block text-white"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: EASE }}>
              {isRtl ? 'الأفلام' : 'Films &'}
            </motion.span>
            <motion.span
              className="block py-[0.15em] leading-[1.1] bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: EASE }}>
              {isRtl ? 'والوثائقيات.' : 'Documentaries.'}
            </motion.span>
          </h1>
        </div>

        {/* Edition tabs — sticky */}
        <motion.div
          className="flex gap-2 mb-6 md:mb-8 flex-wrap sticky top-14 md:top-16 z-20 py-3"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {EDITIONS.map((ed, i) => (
            <button
              key={ed.number}
              onClick={() => setActiveEdition(i)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-[12px] md:text-[13px] font-semibold transition-all duration-300"
              style={activeEdition === i ? {
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span className="font-mono opacity-60 text-[10px]">{ed.number}</span>
              <span>{isRtl ? ed.labelAr : ed.labelEn}</span>
              <span className="opacity-40 text-[10px]">{ed.year}</span>
            </button>
          ))}
        </motion.div>

        {/* Dynamic frame grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeEdition}
            className="w-full rounded-2xl overflow-hidden"
            style={{ height: 'clamp(320px, 60vh, 640px)' }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <DynamicFrameLayout
              frames={frames}
              cols={2}
              rows={2}
              gapSize={6}
              hoverSize={7}
              onPlay={setActiveVideo}
            />
          </motion.div>
        </AnimatePresence>

        {/* Edition info */}
        <motion.div
          key={`info-${activeEdition}`}
          className="flex items-center gap-3 mt-5"
          dir={isRtl ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {edition.year}
          </span>
          <span className="text-white font-semibold text-sm md:text-base">
            {isRtl ? edition.labelAr : edition.labelEn}
          </span>
          <span className="text-white/25 text-[12px]">
            · {edition.videos.length} {isRtl ? 'مقاطع' : 'videos'}
          </span>
        </motion.div>

      </div>

      {/* ── Video modal with custom player ── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setActiveVideo(null)}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <X size={17} />
            </button>
            <div className="relative z-10 w-full" onClick={e => e.stopPropagation()}>
              <UniversalPlayer src={activeVideo} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
