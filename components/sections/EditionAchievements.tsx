'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Users, Quote } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ACHIEVEMENT_EDITIONS, type AchievementStudent } from '@/lib/achievements-data';

const EASE = [0.16, 1, 0.3, 1] as const;

// photos[0] = student portrait · photos[1,2] = project photos
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
}

function Avatar({
  src, name, color, size,
}: { src: string; name: string; color: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: color + '22' }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover"
          onError={() => setFailed(true)} />
      ) : (
        <span style={{ color, fontSize: size * 0.36, fontWeight: 700 }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function ProjectPhoto({ src, color, name }: { src: string; color: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover"
          onError={() => setFailed(true)} />
      ) : (
        <span className="text-[11px] font-bold opacity-40" style={{ color }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

// ── Card 1: Individual innovator ────────────────────────────────────────────
function IndividualCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: EASE }}
      className="flex flex-col gap-4"
    >
      {/* Student identity */}
      <div className="flex items-center gap-3">
        <Avatar src={student.photos[0]} name={student.name} color={student.color} size={52} />
        <div className="flex-1 min-w-0">
          <p className="font-outfit font-bold text-white text-[15px] leading-tight truncate">
            {student.name}
          </p>
          <p className="text-[12px] text-white/40 leading-snug mt-0.5 line-clamp-2">
            {lang === 'ar' ? student.projectAr : student.projectEn}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* 2 project photos */}
      <div className="grid grid-cols-2 gap-2">
        <ProjectPhoto src={student.photos[1]} color={student.color} name={student.name} />
        <ProjectPhoto src={student.photos[2]} color={student.color} name={student.name} />
      </div>

    </motion.div>
  );
}

// ── Card 2: Team innovator (full-width) ──────────────────────────────────────
function TeamCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  const members = student.members ?? [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.055, ease: EASE }}
      className="sm:col-span-2 flex flex-col sm:flex-row-reverse gap-5 items-start"
    >
      {/* Project photos */}
      <div className="w-full sm:w-[45%] shrink-0 grid grid-cols-2 gap-2">
        <ProjectPhoto src={student.photos[1]} color={student.color} name={student.name} />
        <ProjectPhoto src={student.photos[2]} color={student.color} name={student.name} />
      </div>

      {/* Members + project info */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Users size={11} className="text-white/30 shrink-0" />
          <span className="text-[9px] font-bold tracking-widest uppercase text-white/30">فريق</span>
        </div>

        <p className="font-outfit font-bold text-white text-[17px] leading-snug">
          {student.name}
        </p>
        <p className="text-[13px] text-white/45 leading-relaxed">
          {lang === 'ar' ? student.projectAr : student.projectEn}
        </p>

        <div className="h-px bg-white/[0.06]" />

        {/* Members */}
        <div className="flex flex-col gap-2">
          {members.map((member, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-white/[0.06]">
                <span className="text-[9px] font-bold text-white/50">
                  {getInitials(member)}
                </span>
              </div>
              <span className="text-[13px] text-white/60">{member}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Card 3: Researcher — horizontal (photo | name + title) ──────────────────
function ResearcherCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  const title = lang === 'ar' ? student.projectAr : student.projectEn;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: EASE }}
      className="flex items-center gap-5"
    >
      {/* Circular photo */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full blur-md opacity-25"
          style={{ background: student.color }} />
        <div className="relative w-16 h-16 rounded-full overflow-hidden"
          style={{ boxShadow: `0 0 0 2px ${student.color}44` }}>
          <Avatar src={student.photos[0]} name={student.name} color={student.color} size={64} />
        </div>
      </div>

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <p className="font-outfit font-bold text-white text-[15px] leading-tight mb-1.5">
          {student.name}
        </p>
        <div className="flex items-start gap-1.5">
          <Quote size={10} style={{ color: student.color }} className="shrink-0 mt-0.5 opacity-50" />
          <p className="text-[12px] leading-relaxed line-clamp-3"
            style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="font-outfit font-black mb-8"
      style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', lineHeight: 1.2 }}>
      <span style={{
        background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
        paddingBottom: '0.1em',
      }}>
        {label}
      </span>
    </h2>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EditionAchievements({ slug }: { slug: string }) {
  const { t, lang } = useLang();
  const isRtl = lang === 'ar';

  const edition = ACHIEVEMENT_EDITIONS.find(e => e.slug === slug);
  if (!edition) return null;

  const innovators   = edition.students.filter(s => s.role === 'innovator');
  const researchers  = edition.students.filter(s => s.role === 'participant');
  const labelKey     = `achievements.edition${edition.number}Label`;
  const yearKey      = `achievements.edition${edition.number}Year`;

  const solo  = innovators.filter(s => !s.members);
  const teams = innovators.filter(s => s.members);

  return (
    <section
      className="min-h-screen bg-black pt-28 pb-24 px-5 md:px-8"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Back ── */}
        <motion.div
          initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: EASE }}
          className="mb-10"
        >
          <Link href="/achievements"
            className="inline-flex items-center gap-2 text-[13px] text-white/35 hover:text-white transition-colors duration-200">
            <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} />
            {t('achievements.back')}
          </Link>
        </motion.div>

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: 0.06, ease: EASE }}
          className="mb-14"
        >
          <div className="flex items-baseline justify-center gap-4 flex-wrap">
            <h1 className="font-outfit font-black text-white leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
              {t(labelKey)}
            </h1>
            <span className="font-outfit font-black text-white/20 leading-none"
              style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)' }}>
              {t(yearKey)}
            </span>
          </div>
        </motion.div>

        {/* ── Innovators ── */}
        {innovators.length > 0 && (
          <div className="mb-14">
            <SectionHeading label={t('achievements.innovatorsSection')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Individual cards */}
              {solo.map((s, i) => (
                <IndividualCard key={s.id} student={s} index={i} />
              ))}
              {/* Team cards — span both columns */}
              {teams.map((s, i) => (
                <TeamCard key={s.id} student={s} index={solo.length + i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Researchers ── */}
        {researchers.length > 0 && (
          <div>
            <SectionHeading label={t('achievements.participantsSection')} />
            <div className="flex flex-col gap-6">
              {researchers.map((s, i) => (
                <ResearcherCard key={s.id} student={s} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
