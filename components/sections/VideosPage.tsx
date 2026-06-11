'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '@/lib/i18n';
import { DynamicFrameLayout } from '@/components/ui/dynamic-frame-layout';
import { X, Film, Tv, Sparkles } from 'lucide-react';
import UniversalPlayer from '@/components/ui/video-player';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Video { id: string; titleAr: string; titleEn: string; titleTr: string; }

interface Edition {
  key: string;
  labelAr: string;
  labelEn: string;
  labelTr: string;
  videos: Video[];
}

// Films section: three editions with their own video sets
const FILM_EDITIONS: Edition[] = [
  {
    key: 'ed1',
    labelAr: 'الدورة الأولى',
    labelEn: 'First Edition',
    labelTr: 'Birinci Baskı',
    videos: [
      { id: 'iYxPgs3AG28', titleAr: 'الفيلم الرسمي — الدورة الأولى', titleEn: 'Official Film — Edition 1', titleTr: 'Resmi Film — 1. Baskı' },
      { id: 'ObWDgJNe9jY', titleAr: 'ملخص الدورة الأولى', titleEn: 'First Edition Highlights', titleTr: '1. Baskı Öne Çıkanlar' },
    ],
  },
  {
    key: 'ed2',
    labelAr: 'الدورة الثانية',
    labelEn: 'Second Edition',
    labelTr: 'İkinci Baskı',
    videos: [
      { id: 'nKb0KFXdmDs', titleAr: 'الفيلم الرسمي — الدورة الثانية', titleEn: 'Official Film — Edition 2', titleTr: 'Resmi Film — 2. Baskı' },
      { id: 'AS_Pj9ECTUw', titleAr: 'ملخص الدورة الثانية', titleEn: 'Second Edition Highlights', titleTr: '2. Baskı Öne Çıkanlar' },
      { id: 'd7eDsdRygBw', titleAr: 'الكلمة الافتتاحية 2024', titleEn: 'Opening Keynote 2024', titleTr: 'Açılış Konuşması 2024' },
      { id: '82pGZ55yUdc', titleAr: 'ورش العمل التفاعلية', titleEn: 'Interactive Workshops', titleTr: 'İnteraktif Atölyeler' },
    ],
  },
  {
    key: 'ed3',
    labelAr: 'الدورة الثالثة',
    labelEn: 'Third Edition',
    labelTr: 'Üçüncü Baskı',
    videos: [
      { id: 'XMZ4htBi20s', titleAr: 'الفيلم الرسمي — الدورة الثالثة', titleEn: 'Official Film — Edition 3', titleTr: 'Resmi Film — 3. Baskı' },
      { id: 'M1p9SkPmv1M', titleAr: 'ملخص الدورة الثالثة', titleEn: 'Third Edition Highlights', titleTr: '3. Baskı Öne Çıkanlar' },
      { id: 'sxLvItf-DSo', titleAr: 'الكلمة الافتتاحية 2025', titleEn: 'Opening Keynote 2025', titleTr: 'Açılış Konuşması 2025' },
      { id: 'OmCqiIk4mlU', titleAr: 'جلسات ومشاريع 2025', titleEn: 'Sessions & Projects 2025', titleTr: 'Oturumlar ve Projeler 2025' },
    ],
  },
];

interface FlatSection {
  key: string;
  labelAr: string;
  labelEn: string;
  labelTr: string;
  icon: React.ReactNode;
  videos: Video[];
}

const TV_SECTION: FlatSection = {
  key: 'tv',
  labelAr: 'القنوات التلفزيونية',
  labelEn: 'TV Channels',
  labelTr: 'TV Kanalları',
  icon: <Tv size={14} />,
  videos: [
    { id: '0ChQcGOzx9E', titleAr: 'تغطية تلفزيونية 1',  titleEn: 'TV Coverage 1',  titleTr: 'TV Yayını 1'  },
    { id: 'Xgbi_G3rPnI', titleAr: 'تغطية تلفزيونية 3',  titleEn: 'TV Coverage 3',  titleTr: 'TV Yayını 3'  },
    { id: 'EQYVdcu3_9I', titleAr: 'تغطية تلفزيونية 4',  titleEn: 'TV Coverage 4',  titleTr: 'TV Yayını 4'  },
    { id: 'eCCgJ2Yz3QE', titleAr: 'تغطية تلفزيونية 5',  titleEn: 'TV Coverage 5',  titleTr: 'TV Yayını 5'  },
    { id: 'IgiMmmG6hRQ', titleAr: 'تغطية تلفزيونية 6',  titleEn: 'TV Coverage 6',  titleTr: 'TV Yayını 6'  },
    { id: 'seUq51Yr5XM', titleAr: 'تغطية تلفزيونية 7',  titleEn: 'TV Coverage 7',  titleTr: 'TV Yayını 7'  },
    { id: 'yPil2yzJCQI', titleAr: 'تغطية تلفزيونية 8',  titleEn: 'TV Coverage 8',  titleTr: 'TV Yayını 8'  },
    { id: 'E5y_MCFV-3c', titleAr: 'تغطية تلفزيونية 9',  titleEn: 'TV Coverage 9',  titleTr: 'TV Yayını 9'  },
    { id: 'xDewSb8zV7A', titleAr: 'تغطية تلفزيونية 10', titleEn: 'TV Coverage 10', titleTr: 'TV Yayını 10' },
  ],
};

const MULHAMOON_SECTION: FlatSection = {
  key: 'mulhamoon',
  labelAr: 'برنامج ملهمون',
  labelEn: 'Mulhamoon',
  labelTr: 'Mulhamoon',
  icon: <Sparkles size={14} />,
  videos: [
    { id: 'XMZ4htBi20s', titleAr: 'ملهمون — الحلقة الأولى', titleEn: 'Mulhamoon — Episode 1', titleTr: 'Mulhamoon — Bölüm 1' },
    { id: 'REGcpGlNvC8', titleAr: 'ملهمون — الحلقة الثانية', titleEn: 'Mulhamoon — Episode 2', titleTr: 'Mulhamoon — Bölüm 2' },
    { id: 'XMZ4htBi20s', titleAr: 'ملهمون — الحلقة الثالثة', titleEn: 'Mulhamoon — Episode 3', titleTr: 'Mulhamoon — Bölüm 3' },
    { id: 'REGcpGlNvC8', titleAr: 'ملهمون — الحلقة الرابعة', titleEn: 'Mulhamoon — Episode 4', titleTr: 'Mulhamoon — Bölüm 4' },
  ],
};

// Top-level section keys
type SectionKey = 'films' | 'tv' | 'mulhamoon';
const SECTION_ORDER: SectionKey[] = ['films', 'tv', 'mulhamoon'];

const GRID_COLS = 2;

// Dynamically calculates grid positions based on actual video count
function videosToFrames(videos: Video[], lang: string) {
  const cols = GRID_COLS;
  const rows = Math.ceil(videos.length / cols);
  return videos.map((v, i) => {
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);
    return {
      id: i,
      youtubeId: v.id,
      title: lang === 'ar' ? v.titleAr : lang === 'tr' ? v.titleTr : v.titleEn,
      defaultPos: {
        x: colIdx * (12 / cols),
        y: rowIdx * (12 / rows),
        w: 12 / cols,
        h: 12 / rows,
      },
      corner: '', edgeHorizontal: '', edgeVertical: '',
      mediaSize: 1, borderThickness: 0, borderSize: 100, isHovered: false,
    };
  });
}

function label(obj: { labelAr: string; labelEn: string; labelTr: string }, lang: string) {
  return lang === 'ar' ? obj.labelAr : lang === 'tr' ? obj.labelTr : obj.labelEn;
}

export default function VideosPage() {
  const { dir, lang, t } = useLang();
  const isRtl = dir === 'rtl';

  const [activeSection, setActiveSection] = useState<SectionKey>('films');
  const [activeEdition, setActiveEdition] = useState(0);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Resolve which videos to show
  let currentVideos: Video[];
  let currentLabel: string;
  let currentCount: number;

  if (activeSection === 'films') {
    const ed = FILM_EDITIONS[activeEdition];
    currentVideos = ed.videos;
    currentLabel = label(ed, lang);
    currentCount = ed.videos.length;
  } else if (activeSection === 'tv') {
    currentVideos = TV_SECTION.videos;
    currentLabel = label(TV_SECTION, lang);
    currentCount = TV_SECTION.videos.length;
  } else {
    currentVideos = MULHAMOON_SECTION.videos;
    currentLabel = label(MULHAMOON_SECTION, lang);
    currentCount = MULHAMOON_SECTION.videos.length;
  }

  const frames = videosToFrames(currentVideos, lang);
  const gridRows = Math.ceil(currentVideos.length / GRID_COLS);
  const gridHeight = Math.max(320, gridRows * 220);

  const sectionLabel = (key: SectionKey) => {
    if (key === 'films') return lang === 'ar' ? 'الأفلام' : lang === 'tr' ? 'Filmler' : 'Films';
    if (key === 'tv') return label(TV_SECTION, lang);
    return label(MULHAMOON_SECTION, lang);
  };

  const sectionIcon = (key: SectionKey) => {
    if (key === 'films') return <Film size={14} />;
    if (key === 'tv') return <Tv size={14} />;
    return <Sparkles size={14} />;
  };

  return (
    <section className="relative min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-base)' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px)',
        backgroundSize: '4rem 4rem',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)',
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 md:pt-28 pb-10 w-full">

        {/* Page title */}
        <div className="mb-8 md:mb-10">
          <h1 className="font-outfit font-bold leading-[0.9] tracking-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 4.5rem)' }}>
            <motion.span className="block text-white"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: EASE }}>
              {t('videos.titleA')}
            </motion.span>
            <motion.span
              className="block gradient-text py-[0.15em] leading-[1.1]"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7, ease: EASE }}>
              {t('videos.titleB')}
            </motion.span>
          </h1>
        </div>

        {/* ── Sticky tab area ── */}
        <div
          className="sticky top-14 md:top-16 z-20 py-3 flex flex-col gap-2"
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          {/* Main section tabs */}
          <motion.div
            className="flex gap-2 flex-wrap"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {SECTION_ORDER.map((key) => (
              <button
                key={key}
                onClick={() => { setActiveSection(key); setActiveEdition(0); }}
                className="flex items-center gap-2 px-3 md:px-5 py-2 rounded-full text-[12px] md:text-[13px] font-semibold transition-all duration-300"
                style={activeSection === key ? {
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
                <span className="opacity-70">{sectionIcon(key)}</span>
                <span>{sectionLabel(key)}</span>
              </button>
            ))}
          </motion.div>

          {/* Edition sub-tabs — only visible when Films is active */}
          <AnimatePresence>
            {activeSection === 'films' && (
              <motion.div
                className="flex gap-2 flex-wrap"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {FILM_EDITIONS.map((ed, i) => (
                  <button
                    key={ed.key}
                    onClick={() => setActiveEdition(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] md:text-[12px] font-medium transition-all duration-200"
                    style={activeEdition === i ? {
                      background: 'rgba(99,179,237,0.15)',
                      border: '1px solid rgba(99,179,237,0.4)',
                      color: '#93c5fd',
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <span className="font-mono opacity-50 text-[9px]">0{i + 1}</span>
                    <span>{label(ed, lang)}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSection}-${activeEdition}`}
            className="w-full rounded-2xl overflow-hidden mt-2"
            style={{ height: `${gridHeight}px` }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <DynamicFrameLayout
              frames={frames}
              cols={GRID_COLS}
              rows={gridRows}
              gapSize={6}
              hoverSize={7}
              onPlay={setActiveVideo}
            />
          </motion.div>
        </AnimatePresence>

        {/* Info bar */}
        <motion.div
          key={`info-${activeSection}-${activeEdition}`}
          className="flex items-center gap-3 mt-5"
          dir={isRtl ? 'rtl' : 'ltr'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="opacity-40">{sectionIcon(activeSection)}</span>
          <span className="text-white font-semibold text-sm md:text-base">{currentLabel}</span>
          <span className="text-white/25 text-[12px]">· {currentCount} {t('videos.count')}</span>
        </motion.div>

      </div>

      {/* Video modal */}
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
