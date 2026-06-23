'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';
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
      <div className="flex min-h-screen items-center justify-center px-4 py-16" style={{ background: 'var(--bg-base)' }}>
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

  const optionBg = isLight ? '#f2f2f7' : '#0d0d0f';

  const brandWords = isRtl
    ? ['إبداعك.', 'ابتكارك.', 'مستقبلك.']
    : ['Innovate.', 'Create.', 'Impact.'];

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ background: 'var(--bg-base)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div
        className={cn('hidden lg:flex lg:w-[44%] relative flex-col overflow-hidden', isRtl ? 'items-end' : '')}
        style={{
          background: 'linear-gradient(145deg, #1a0438 0%, #2e1b6e 45%, #0c0a28 100%)',
          minHeight: '100vh',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 55% at 50% 18%, rgba(139,92,246,0.40) 0%, transparent 70%)',
        }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{
          background: 'linear-gradient(to top, rgba(10,5,30,0.9), transparent)',
        }} />

        {/* Logo — top */}
        <div className={cn('relative z-10 p-10 flex items-center gap-3', isRtl ? 'flex-row-reverse' : '')}>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <span className="text-white font-black text-sm font-outfit">C</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight font-outfit">CICT 2026</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom text */}
        <div className={cn('relative z-10 p-10', isRtl ? 'text-right' : 'text-left')}>
          <div className="mb-6">
            {brandWords.map((word, i) => (
              <p
                key={i}
                className="font-outfit font-black leading-[1.05]"
                style={{
                  fontSize: 'clamp(2rem, 3vw, 2.6rem)',
                  color: `rgba(255,255,255,${1 - i * 0.25})`,
                }}
              >
                {word}
              </p>
            ))}
          </div>
          <p
            className="text-[13px] leading-relaxed mb-7"
            style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '30ch' }}
          >
            {isRtl
              ? 'نربط بين الإبداع البشري والتقنيات المتقدمة في مؤتمر دولي استثنائي.'
              : 'Connecting human creativity with advanced technology at an extraordinary international conference.'}
          </p>
          <div className={cn('flex flex-col gap-2.5', isRtl ? 'items-end' : '')}>
            {[
              { icon: Calendar, text: p.date },
              { icon: MapPin, text: p.location },
              { icon: Users, text: isRtl ? '+٥٠٠ مشارك' : '500+ attendees' },
            ].map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className={cn('flex items-center gap-2 text-[13px]', isRtl ? 'flex-row-reverse' : '')}
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-20 lg:py-16 overflow-y-auto">
        <div className="w-full max-w-[460px]">
          <form onSubmit={handleSubmit}>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mb-8"
            >
              {/* Mobile logo */}
              <div className={cn('flex items-center gap-2.5 mb-7 lg:hidden', isRtl ? 'flex-row-reverse' : '')}>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))' }}
                >
                  <span className="text-white font-black text-xs font-outfit">C</span>
                </div>
                <span className="font-bold text-sm font-outfit" style={{ color: 'var(--text-primary)' }}>CICT 2026</span>
              </div>

              <h1
                className="font-outfit font-bold tracking-tight"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.875rem)', color: 'var(--text-primary)', lineHeight: 1.15 }}
              >
                {p.title}
              </h1>
              <p className="mt-2 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {p.subtitle}
              </p>
            </motion.div>

            {/* Fields */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: EASE }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {p.fieldName} <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                </label>
                <input
                  required
                  type="text"
                  value={fields.fullName}
                  onChange={set('fullName')}
                  placeholder={p.phName}
                  className="input-glass"
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldEmail} <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={fields.email}
                    onChange={set('email')}
                    placeholder={p.phEmail}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldPhone} <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={fields.phone}
                    onChange={set('phone')}
                    placeholder={p.phPhone}
                    className="input-glass"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Country + Org */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldCountry} <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={fields.country}
                    onChange={set('country')}
                    placeholder={p.phCountry}
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldOrg}
                  </label>
                  <input
                    type="text"
                    value={fields.organization}
                    onChange={set('organization')}
                    placeholder={p.phOrg}
                    className="input-glass"
                  />
                </div>
              </div>

              {/* Track */}
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {p.fieldTrack} <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={track}
                    onChange={e => setTrack(e.target.value)}
                    className="input-glass appearance-none cursor-pointer"
                    style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                  >
                    <option value="" disabled style={{ background: optionBg }}>—</option>
                    {trackOptions.map((opt, i) => (
                      <option key={i} value={opt} style={{ background: optionBg }}>{opt}</option>
                    ))}
                  </select>
                  <div
                    className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2', isRtl ? 'left-3' : 'right-3')}
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Participation type — pill tabs */}
              <div>
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {p.sectionParticipation}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const isSel = selected === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelected(cat.id)}
                        className="relative rounded-xl py-3 text-sm font-medium transition-all duration-200 text-center"
                        style={{
                          background: isSel
                            ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))'
                            : 'var(--mat-liquid-bg)',
                          border: `1px solid ${isSel ? 'transparent' : 'var(--mat-liquid-border)'}`,
                          color: isSel ? '#ffffff' : 'var(--text-secondary)',
                        }}
                      >
                        {cat.recommended && (
                          <span
                            className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px text-[9px] font-bold rounded-full whitespace-nowrap"
                            style={{
                              background: isSel ? 'rgba(255,255,255,0.25)' : 'var(--accent-cyan)',
                              color: isSel ? '#fff' : 'var(--bg-base)',
                            }}
                          >
                            ★
                          </span>
                        )}
                        {cat.labels[l]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Error */}
            {status === 'error' && (
              <p className="mt-4 text-sm text-center text-red-400">{p.errorMsg}</p>
            )}

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-6 space-y-4"
            >
              <button
                type="submit"
                disabled={status === 'loading'}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white',
                  'transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]',
                  isRtl && 'flex-row-reverse',
                )}
                style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))' }}
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

              <p className={cn('text-center text-[13px]', isRtl ? '' : '')}>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {isRtl ? 'تريد العودة؟ ' : 'Changed your mind? '}
                </span>
                <Link
                  href="/"
                  className="font-medium underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {p.btnCancel}
                </Link>
              </p>
            </motion.div>

          </form>
        </div>
      </div>
    </div>
  );
}
