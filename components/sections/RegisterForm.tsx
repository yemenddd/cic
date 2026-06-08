'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CircleCheck, MapPin, Calendar, Users, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import ConferenceBadge from '@/components/ui/ConferenceBadge';
import { downloadBadgePDF } from '@/lib/download-badge-pdf';

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE FORMS CONFIG
//
// HOW TO GET YOUR ENTRY IDs:
//  1. Open your Google Form in a browser (forms.google.com)
//  2. Click the 3-dot menu → "Get pre-filled link"
//  3. Fill in dummy values in every field, click "Get link"
//  4. The URL will look like:
//     https://docs.google.com/forms/d/e/.../viewform?usp=pp_url
//       &entry.123456789=dummy+name
//       &entry.987654321=dummy%40email.com  ← these are your entry IDs
//  5. Replace each REPLACE_X below with the matching entry.XXXXXXXXX value
//  6. Set GOOGLE_FORM_ACTION to your form URL with "viewform" → "formResponse"
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSfWEUOR3VvSnodQfx7k3KwMl8-BwsQizEV2WXul5-Qo-pZtYQ/formResponse';

const ENTRY = {
  fullName:     'entry.162680631',   // الاسم الكامل / Full Name
  email:        'entry.1271546915',  // البريد الإلكتروني / Email
  phone:        'entry.1088912301',  // رقم الواتساب / WhatsApp
  country:      'entry.692822831',   // الدولة / Country
  organization: 'entry.2127532988',  // المؤسسة / Organization
  category:     'entry.186138454',   // نوع المشاركة / Category
  track:        'entry.200598670',   // المسار / Track
};
// ─────────────────────────────────────────────────────────────────────────────

type Lang = 'ar' | 'en' | 'tr';

interface LocalizedText {
  ar: string;
  en: string;
  tr: string;
}

interface Category {
  id: string;
  recommended: boolean;
  labels: LocalizedText;
  features: { ar: string[]; en: string[]; tr: string[] };
}

const CATEGORIES: Category[] = [
  {
    id: 'visitor',
    recommended: false,
    labels: { ar: 'زائر', en: 'Visitor', tr: 'Ziyaretçi' },
    features: {
      ar: ['حضور جميع الجلسات العامة', 'استكشاف المعرض التقني', 'التواصل مع الخبراء', 'شهادة مشاركة رسمية'],
      en: ['Access to all public sessions', 'Explore the innovation exhibition', 'Network with experts', 'Official participation certificate'],
      tr: ['Tüm genel oturumlara erişim', 'İnovasyon sergisini keşfedin', 'Uzmanlarla ağ kurma', 'Resmi katılım sertifikası'],
    },
  },
  {
    id: 'participant',
    recommended: true,
    labels: { ar: 'مشارك', en: 'Participant', tr: 'Katılımcı' },
    features: {
      ar: ['كل مميزات الزائر', 'المشاركة في ورشات العمل', 'عرض بحث أو مشروع', 'الأولوية في جلسات التواصل'],
      en: ['All Visitor benefits', 'Join workshops & competitions', 'Present a research or project', 'Priority networking sessions'],
      tr: ['Tüm Ziyaretçi hakları', 'Atölye ve yarışmalara katılım', 'Araştırma veya proje sunumu', 'Öncelikli ağ kurma oturumları'],
    },
  },
  {
    id: 'volunteer',
    recommended: false,
    labels: { ar: 'متطوع', en: 'Volunteer', tr: 'Gönüllü' },
    features: {
      ar: ['المساهمة في تنظيم المؤتمر', 'خبرة إدارية وتنظيمية عملية', 'شهادة تطوع معتمدة', 'اجتماعات مع الفريق التنظيمي'],
      en: ['Contribute to conference organization', 'Hands-on management experience', 'Certified volunteering certificate', 'Meetings with the organizing team'],
      tr: ['Konferans organizasyonuna katkı', 'Uygulamalı yönetim deneyimi', 'Onaylı gönüllülük sertifikası', 'Organizasyon ekibiyle toplantılar'],
    },
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-cyan-400/50 focus:bg-white/8 focus:ring-1 focus:ring-cyan-400/20';

const labelClass = 'block text-sm font-medium text-white/70 mb-1.5';

// ── Confirmation code: deterministic 6-char from name + timestamp ──────────
function generateCode(name: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = Date.now();
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x9e3779b9) >>> 0;
  let code = '';
  for (let i = 0; i < 6; i++) { code += chars[h % chars.length]; h = Math.imul(h, 0x5bd1e995) >>> 0; }
  return `CICT-2026-${code}`;
}

export default function RegisterForm() {
  const { tx, lang, dir } = useLang();
  const p = tx<Record<string, string>>('registerPage');
  const isRtl = dir === 'rtl';
  const l = lang as Lang;
  const [selected, setSelected] = useState(CATEGORIES[0].id);
  const [track, setTrack] = useState('');
  const [fields, setFields] = useState({ fullName: '', email: '', phone: '', country: '', organization: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [confirmCode, setConfirmCode] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(prev => ({ ...prev, [k]: e.target.value }));

  const trackOptions = [p.trackOpt1, p.trackOpt2, p.trackOpt3, p.trackOpt4];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const body = new FormData();
      body.append(ENTRY.fullName, fields.fullName);
      body.append(ENTRY.email, fields.email);
      body.append(ENTRY.phone, fields.phone);
      body.append(ENTRY.country, fields.country);
      body.append(ENTRY.organization, fields.organization);
      body.append(ENTRY.category, selected);
      body.append(ENTRY.track, track);
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', body, mode: 'no-cors' });
      setConfirmCode(generateCode(fields.fullName));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const handleDownloadPDF = useCallback(() => {
    downloadBadgePDF(fields.fullName);
  }, [fields.fullName]);

  const handleCopyLink = useCallback(() => {
    const cat = CATEGORIES.find(c => c.id === selected);
    const url = `${window.location.origin}/register/confirmation?n=${encodeURIComponent(fields.fullName)}&c=${selected}&cl=${encodeURIComponent(cat?.labels[l] ?? '')}&t=${encodeURIComponent(track)}&k=${confirmCode}&lang=${lang}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [fields.fullName, selected, track, confirmCode, lang, l]);

  // ── Success state: Conference Badge ────────────────────────────────────────
  if (status === 'success') {
    const cat = CATEGORIES.find(c => c.id === selected)!;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] px-4 py-16">
        <ConferenceBadge
          name={fields.fullName}
          categoryId={selected}
          categoryLabel={cat.labels[l]}
          organization={fields.organization}
          track={track}
          code={confirmCode}
          date={p.date}
          location={p.location}
          lang={lang as 'ar' | 'en' | 'tr'}
          onDownloadPDF={handleDownloadPDF}
          onCopyLink={handleCopyLink}
          copied={copied}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] px-4 pb-20 pt-32" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Stars background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 100%), radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 100%)',
          backgroundSize: '400px 400px, 300px 300px, 500px 500px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712]" />
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-6xl">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10"
        >
          <span className="mb-3 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            CICT 2026
          </span>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-sm text-white/50 max-w-xl">{p.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">

          {/* ── Left column: form fields ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
            className="lg:col-span-7"
          >
            {/* Personal info */}
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">{p.sectionPersonal}</p>
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className={labelClass}>
                  {p.fieldName} <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={fields.fullName}
                  onChange={set('fullName')}
                  placeholder={p.phName}
                  className={inputClass}
                />
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {p.fieldEmail} <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={fields.email}
                    onChange={set('email')}
                    placeholder={p.phEmail}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {p.fieldPhone} <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={fields.phone}
                    onChange={set('phone')}
                    placeholder={p.phPhone}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Country + Org row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {p.fieldCountry} <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={fields.country}
                    onChange={set('country')}
                    placeholder={p.phCountry}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{p.fieldOrg}</label>
                  <input
                    type="text"
                    value={fields.organization}
                    onChange={set('organization')}
                    placeholder={p.phOrg}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Track */}
              <div>
                <label className={labelClass}>
                  {p.fieldTrack} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={track}
                    onChange={e => setTrack(e.target.value)}
                    className={cn(inputClass, 'appearance-none cursor-pointer')}
                    style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                  >
                    <option value="" disabled style={{ background: '#030712' }}>—</option>
                    {trackOptions.map((opt, i) => (
                      <option key={i} value={opt} style={{ background: '#030712' }}>{opt}</option>
                    ))}
                  </select>
                  <div className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-white/40', isRtl ? 'left-3' : 'right-3')}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation type */}
            <div className="mt-10">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">{p.sectionParticipation}</p>
              <p className="mb-4 text-sm text-white/60">{p.catLabel}</p>

              <div className="space-y-3">
                {CATEGORIES.map(cat => {
                  const isSelected = selected === cat.id;
                  return (
                    <label
                      key={cat.id}
                      htmlFor={`cat-${cat.id}`}
                      className={cn(
                        'relative block cursor-pointer rounded-xl border transition-all duration-200',
                        isSelected
                          ? 'border-cyan-400/30 bg-white/5 ring-1 ring-cyan-400/20'
                          : 'border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/4',
                      )}
                    >
                      <div className={cn('flex items-start gap-4 px-5 py-4', isRtl ? 'flex-row-reverse' : 'flex-row')}>
                        {/* Radio */}
                        <div className="mt-0.5 flex-shrink-0">
                          <input
                            type="radio"
                            id={`cat-${cat.id}`}
                            name="category"
                            value={cat.id}
                            checked={isSelected}
                            onChange={() => setSelected(cat.id)}
                            className="sr-only"
                          />
                          <div className={cn(
                            'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-white/30',
                          )}>
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-[#030712]" />}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className={cn('flex flex-wrap items-center gap-2 mb-2', isRtl ? 'flex-row-reverse' : '')}>
                            <span className="text-sm font-semibold text-white">{cat.labels[l]}</span>
                            {cat.recommended && (
                              <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-400/20">
                                {p.catBadge}
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {cat.features[l].map((f, i) => (
                              <li key={i} className={cn('flex items-center gap-2 text-xs text-white/55', isRtl ? 'flex-row-reverse' : '')}>
                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Footer bar */}
                      <div className={cn(
                        'flex items-center justify-between rounded-b-xl border-t px-5 py-2.5',
                        isSelected ? 'border-white/8 bg-white/4' : 'border-white/5 bg-white/2',
                      )}>
                        <a href="#" className={cn('inline-flex items-center gap-1 text-xs text-cyan-400/70 hover:text-cyan-400', isRtl ? 'flex-row-reverse' : '')}>
                          {p.catLearnMore}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-sm font-semibold text-white/80">
                          {p.free} <span className="text-xs font-normal text-white/40">/ {p.free_mo}</span>
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Right column: info card ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
            className="lg:col-span-5"
          >
            <div
              className="sticky top-28 rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Gradient accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), rgba(139,92,246,0.4), transparent)' }} />

              <h4 className="text-sm font-semibold text-white">{p.cardTitle}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{p.cardDesc}</p>

              {/* Event meta */}
              <div className="mt-5 space-y-2.5">
                {[
                  { icon: Calendar, text: p.date },
                  { icon: MapPin, text: p.location },
                  { icon: Users, text: p.cardF1 },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className={cn('flex items-center gap-2.5 text-sm text-white/70', isRtl ? 'flex-row-reverse' : '')}>
                    <Icon className="h-4 w-4 flex-shrink-0 text-cyan-400/70" />
                    {text}
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <div
                className="mt-5 rounded-xl p-4"
                style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)' }}
              >
                <ul className="space-y-2">
                  {[p.cardF2, p.cardF3].map((item, i) => (
                    <li key={i} className={cn('flex items-center gap-2 text-sm text-white/70', isRtl ? 'flex-row-reverse' : '')}>
                      <CircleCheck className="h-4 w-4 flex-shrink-0 text-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gradient divider */}
              <div className="my-5 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

              {/* Selected category summary */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {(() => {
                    const cat = CATEGORIES.find(c => c.id === selected)!;
                    return (
                      <div className={cn('flex items-center gap-3', isRtl ? 'flex-row-reverse' : '')}>
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(6,182,212,0.2)' }}>
                          <Check className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <p className="text-xs text-white/40">{p.sectionParticipation}</p>
                          <p className="text-sm font-semibold text-white">{cat.labels[l]}</p>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* ── Footer: action buttons ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12"
        >
          <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

          {status === 'error' && (
            <p className="mb-4 text-center text-sm text-red-400">{p.errorMsg}</p>
          )}

          <div className={cn('flex items-center gap-4', isRtl ? 'flex-row-reverse justify-start' : 'justify-end')}>
            <Link
              href="/"
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
            >
              {p.btnCancel}
            </Link>

            <button
              type="submit"
              disabled={status === 'loading'}
              className={cn(
                'relative inline-flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold text-white transition-all',
                'disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]',
                isRtl && 'flex-row-reverse',
              )}
              style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
            >
              {status === 'loading' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>…</span>
                </>
              ) : (
                <>
                  {p.btnSubmit}
                  <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
