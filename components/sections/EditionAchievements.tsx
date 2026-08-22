'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Users, Quote, User } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { ACHIEVEMENT_EDITIONS, type AchievementStudent } from '@/lib/achievements-data';
import type { AchievementStudent as SanityAchievementStudent } from '@/lib/sanity/queries';
import { urlFor } from '@/lib/sanity/image';

const EASE = [0.16, 1, 0.3, 1] as const;

function Avatar({ src, name, color, size }: { src: string; name: string; color: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: color + '22' }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <User size={size * 0.45} style={{ color, opacity: 0.7 }} />
      )}
    </div>
  );
}

function ProjectPhoto({ src, color }: { src: string; color: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Users size={28} style={{ color, opacity: 0.35 }} />
      )}
    </div>
  );
}

/* ── Individual innovator ── */
function IndividualCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: EASE }}
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{
        background: 'var(--mat-liquid-bg)',
        border: '1px solid var(--mat-liquid-border)',
        boxShadow: 'var(--mat-liquid-shadow)',
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar src={student.photos[0]} name={student.name} color={student.color} size={52} />
        <div className="flex-1 min-w-0">
          <p className="font-outfit font-bold text-[15px] leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {student.name}
          </p>
          <p className="text-[12px] leading-snug mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {lang === 'ar' ? student.projectAr : student.projectEn}
          </p>
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--mat-liquid-border)' }} />

      <div className="grid grid-cols-2 gap-2">
        <ProjectPhoto src={student.photos[1]} color={student.color} />
        <ProjectPhoto src={student.photos[2]} color={student.color} />
      </div>
    </motion.div>
  );
}

/* ── Team innovator ── */
function TeamCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  const members = student.members ?? [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.055, ease: EASE }}
      className="sm:col-span-2 flex flex-col-reverse sm:flex-row-reverse gap-5 items-start rounded-2xl p-5"
      style={{
        background: 'var(--mat-liquid-bg)',
        border: '1px solid var(--mat-liquid-border)',
        boxShadow: 'var(--mat-liquid-shadow)',
      }}
    >
      <div className="w-full sm:w-[45%] shrink-0 grid grid-cols-2 gap-2">
        <ProjectPhoto src={student.photos[1]} color={student.color} />
        <ProjectPhoto src={student.photos[2]} color={student.color} />
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Users size={11} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>فريق</span>
        </div>

        <p className="font-outfit font-bold text-[17px] leading-snug" style={{ color: 'var(--text-primary)' }}>
          {student.name}
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {lang === 'ar' ? student.projectAr : student.projectEn}
        </p>

        <div className="h-px" style={{ background: 'var(--mat-liquid-border)' }} />

        <div className="flex flex-col gap-2">
          {members.map((member, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}>
                <User size={13} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{member}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Researcher ── */
function ResearcherCard({ student, index }: { student: AchievementStudent; index: number }) {
  const { lang } = useLang();
  const title = lang === 'ar' ? student.projectAr : student.projectEn;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.055, ease: EASE }}
      className="flex items-center gap-5 rounded-2xl p-4"
      style={{
        background: 'var(--mat-liquid-bg)',
        border: '1px solid var(--mat-liquid-border)',
        boxShadow: 'var(--mat-liquid-shadow)',
      }}
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full blur-md opacity-25" style={{ background: student.color }} />
        <div className="relative w-16 h-16 rounded-full overflow-hidden"
          style={{ boxShadow: `0 0 0 2px ${student.color}44` }}>
          <Avatar src={student.photos[0]} name={student.name} color={student.color} size={64} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-outfit font-bold text-[15px] leading-tight mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {student.name}
        </p>
        <div className="flex items-start gap-1.5">
          <Quote size={10} style={{ color: student.color }} className="shrink-0 mt-0.5 opacity-50" />
          <p className="text-[12px] leading-relaxed line-clamp-3"
            style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section heading ── */
function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="font-outfit font-black mb-8"
      style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', lineHeight: 1.2, color: 'var(--text-primary)' }}>
      {label}
    </h2>
  );
}

/* ── Page ── */
export default function EditionAchievements({ slug, data }: { slug: string; data?: SanityAchievementStudent[] }) {
  const { t, lang } = useLang();
  const isRtl = lang === 'ar';

  const edition = ACHIEVEMENT_EDITIONS.find(e => e.slug === slug);
  if (!edition) return null;

  const students: AchievementStudent[] = data?.length
    ? data.map(s => {
        const photos: [string, string, string] = [
          s.photos?.[0] ? urlFor(s.photos[0]).width(600).url() : '',
          s.photos?.[1] ? urlFor(s.photos[1]).width(600).url() : '',
          s.photos?.[2] ? urlFor(s.photos[2]).width(600).url() : '',
        ];
        return {
          id: s.studentId,
          name: s.name,
          members: s.members,
          projectAr: s.projectTitle?.ar || '',
          projectEn: s.projectTitle?.en || s.projectTitle?.ar || '',
          role: s.role,
          photos,
          videoId: s.videoId || '',
          color: s.color || '#0078D4',
        };
      })
    : edition.students;

  const innovators  = students.filter(s => s.role === 'innovator');
  const researchers = students.filter(s => s.role === 'participant');
  const labelKey    = `achievements.edition${edition.number}Label`;
  const yearKey     = `achievements.edition${edition.number}Year`;
  const solo        = innovators.filter(s => !s.members);
  const teams       = innovators.filter(s => s.members);

  return (
    <section
      className="min-h-screen pt-28 pb-24 px-5 md:px-8"
      style={{ background: 'var(--bg-base)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: isRtl ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, ease: EASE }}
          className="mb-10"
        >
          <Link
            href="/achievements"
            className="inline-flex items-center gap-2 text-[13px] transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} />
            {t('achievements.back')}
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: 0.06, ease: EASE }}
          className="mb-14"
        >
          <div className="flex items-baseline justify-center gap-4 flex-wrap">
            <h1 className="font-outfit font-black leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--text-primary)' }}>
              {t(labelKey)}
            </h1>
            <span className="font-outfit font-black leading-none"
              style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)', color: 'var(--text-tertiary)' }}>
              {t(yearKey)}
            </span>
          </div>
        </motion.div>

        {/* Innovators */}
        {innovators.length > 0 && (
          <div className="mb-14">
            <SectionHeading label={t('achievements.innovatorsSection')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {solo.map((s, i) => (
                <IndividualCard key={s.id} student={s} index={i} />
              ))}
              {teams.map((s, i) => (
                <TeamCard key={s.id} student={s} index={solo.length + i} />
              ))}
            </div>
          </div>
        )}

        {/* Researchers */}
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
