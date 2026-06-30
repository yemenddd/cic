'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';
import { ACHIEVEMENT_EDITIONS } from '@/lib/achievements-data';

const EASE = [0.16, 1, 0.3, 1] as const;

const BG_GRADIENTS = [
  'linear-gradient(145deg, #050d1a 0%, #071828 50%, #040e1c 100%)',
  'linear-gradient(145deg, #0e0515 0%, #180a28 50%, #0c0412 100%)',
  'linear-gradient(145deg, #030f0a 0%, #061a10 50%, #041209 100%)',
];

const COVER_IMAGES = [
  '/images/attends/1.jpg',
  '/images/gallery/DSC02581.jpg',
  '/images/gallery/DSC06161.jpg',
];

function EditionCard({
  edition,
  index,
}: {
  edition: (typeof ACHIEVEMENT_EDITIONS)[0];
  index: number;
}) {
  const { t, lang } = useLang();
  const [hovered, setHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const labelKey = `achievements.edition${edition.number}Label`;
  const yearKey  = `achievements.edition${edition.number}Year`;
  const innovators  = edition.students.filter(s => s.role === 'innovator').length;
  const researchers = edition.students.filter(s => s.role === 'participant').length;

  const containerVariants = {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: prefersReduced ? 1 : 1.025,
      y: prefersReduced ? 0 : -6,
      transition: { type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.6 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 22, filter: 'blur(5px)' },
    visible: {
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: {
        type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.6,
        staggerChildren: 0.07, delayChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring' as const, stiffness: 380, damping: 24 },
    },
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/achievements/${edition.slug}`}>
        <div
          className="relative w-full rounded-3xl overflow-hidden cursor-pointer"
          style={{ height: 380, background: BG_GRADIENTS[index] }}
        >
          {/* Cover image */}
          <motion.img
            src={COVER_IMAGES[index]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.06, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
            }}
          />

          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),
                                linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)`,
              backgroundSize: '36px 36px',
            }}
          />

          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Gradient overlays — ProfileCard style */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Content */}
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Edition badge */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/60"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{ background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)' }}
                >
                  {edition.number}
                </span>
                {t(labelKey)}
              </span>
            </motion.div>

            {/* Year */}
            <motion.h2
              variants={itemVariants}
              className="font-outfit font-black text-white leading-none"
              style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3rem)' }}
            >
              {t(yearKey)}
            </motion.h2>

            {/* Stats */}
            <motion.div variants={itemVariants} className="flex items-center gap-5">
              <div>
                <p className="text-xl font-bold text-white">{innovators}</p>
                <p className="text-[11px] text-white/38 mt-0.5">{t('achievements.innovationsLabel')}</p>
              </div>
              <div className="w-px h-7 bg-white/[0.12]" />
              <div>
                <p className="text-xl font-bold text-white">{researchers}</p>
                <p className="text-[11px] text-white/38 mt-0.5">{t('achievements.researchLabel')}</p>
              </div>
            </motion.div>

            {/* CTA button */}
            <motion.div variants={itemVariants} className="pt-1 mx-1">
              <motion.span
                className="flex items-center justify-center w-full py-2.5 rounded-2xl text-[13px] font-semibold text-white"
                animate={{
                  background: hovered ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                  borderColor: hovered ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                }}
                transition={{ duration: 0.25 }}
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {t('achievements.viewEdition')} ↗
              </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AchievementsPage() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isRtl = lang === 'ar';
  const titleGrad = 'linear-gradient(to right, #4a98e8, #6c3ecc)';

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center py-24"
      style={{ background: 'var(--bg-base)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="px-5 md:px-8 mb-14 md:mb-18 text-center"
      >
        <h1
          className="font-outfit font-black leading-[1.1]"
          style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{t('achievements.titleA')}</span>
          {' '}
          <span style={{
            background: titleGrad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
            paddingTop: '0.2em',
            paddingBottom: '0.5em',
          }}>{t('achievements.titleB')}</span>
        </h1>
      </motion.div>

      <div className="w-full flex justify-center px-5 md:px-8">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
          {ACHIEVEMENT_EDITIONS.map((edition, i) => (
            <motion.div
              key={edition.slug}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
            >
              <EditionCard edition={edition} index={i} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
