'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CircleCheck, MapPin, Calendar, ArrowRight, Award, Eye, HandHelping, Lock } from 'lucide-react';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';
import ConferenceBadge from '@/components/ui/ConferenceBadge';
import { downloadBadgePDF } from '@/lib/download-badge-pdf';
import { CATEGORIES, type Lang } from '@/lib/categories';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const CATEGORY_ICONS: Record<string, typeof Award> = {
  visitor:     Eye,
  participant: Award,
  volunteer:   HandHelping,
};

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const [confirmCode, setConfirmCode] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(prev => ({ ...prev, [k]: e.target.value }));

  const trackOptions = [p.trackOpt1, p.trackOpt2, p.trackOpt3, p.trackOpt4];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password.length < 8) {
      setErrorMsg(p.pwTooShort ?? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      setStatus('error');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg(p.pwMismatch ?? 'كلمتا المرور غير متطابقتين');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, category: selected, track, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error ?? p.errorMsg);
        setStatus('error');
        return;
      }
      setConfirmCode(data.code);
      setStatus('success');
      // Registration creates the account, so sign them straight in — the
      // badge they're about to see is now permanently in their dashboard.
      await signIn('credentials', { email: fields.email, password, redirect: false });
      router.refresh();
    } catch {
      setErrorMsg(p.errorMsg);
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16" style={{ background: 'var(--bg-base)' }}>
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
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {p.goToDashboard ?? 'الذهاب إلى لوحتي'}
          <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
        </Link>
      </div>
    );
  }

  const optionBg = isLight ? '#f2f2f7' : '#0d0d0f';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-base)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Subtle grid — dark mode only */}
      {!isLight && (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(var(--mat-liquid-border) 1px, transparent 1px),
                                linear-gradient(90deg, var(--mat-liquid-border) 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
              opacity: 0.4,
            }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, var(--bg-base))' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-5 md:px-8 pt-32 pb-24">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-14 text-center"
        >
          <h1
            className="font-outfit font-black tracking-tight"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
          >
            {p.title}
          </h1>
          <p
            className="mt-3 max-w-xl mx-auto font-semibold"
            style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}
          >
            {p.subtitle}
          </p>

          {/* Required fields note */}
          <p className="mt-4 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
            <span style={{ color: '#ef4444' }}>*</span>
            {' '}{p.requiredNote ?? 'الحقول المشار إليها إلزامية'}
          </p>
        </motion.div>

        {/* ── Main form card ───────────────────────────────────────────── */}
        <div
          className="rounded-3xl p-8 md:p-10 mb-2"
          style={{
            background: isLight ? 'rgba(255,255,255,0.72)' : '#161618',
            border: '1px solid var(--mat-liquid-border)',
            boxShadow: isLight
              ? '0 2px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
              : '0 4px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

          {/* ── Left column: form fields ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
            className="lg:col-span-7 space-y-10"
          >
            {/* Personal info */}
            <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--border-strong)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.sectionPersonal}</p>
            </div>
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {p.fieldName} <span style={{ color: '#ef4444' }}>*</span>
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

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldEmail} <span style={{ color: '#ef4444' }}>*</span>
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
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldPhone} <span style={{ color: '#ef4444' }}>*</span>
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

              {/* Country + Org row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldCountry} <span style={{ color: '#ef4444' }}>*</span>
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
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
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

              {/* Password — registering creates the attendee's account */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldPassword ?? 'كلمة المرور'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-glass"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {p.fieldPasswordConfirm ?? 'تأكيد كلمة المرور'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className="input-glass"
                    dir="ltr"
                  />
                </div>
              </div>
              <p className="text-[12px] -mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {p.passwordNote ?? 'ينشئ التسجيل حسابك في المنصة — 8 أحرف على الأقل.'}
              </p>

              {/* Track */}
              <div>
                <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {p.fieldTrack} <span style={{ color: '#ef4444' }}>*</span>
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
            </div>
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: 'var(--mat-liquid-border)' }} />

            {/* Participation type */}
            <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: 'var(--border-strong)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.sectionParticipation}</p>
            </div>
            <p className="mb-6 text-[13px]" style={{ color: 'var(--text-secondary)', paddingInlineStart: '1rem' }}>{p.catLabel}</p>

              <div className="space-y-3">
                {CATEGORIES.map(cat => {
                  const isSelected = selected === cat.id;
                  const CatIcon = CATEGORY_ICONS[cat.id];
                  return (
                    <label
                      key={cat.id}
                      htmlFor={`cat-${cat.id}`}
                      className="relative block cursor-pointer rounded-xl transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--mat-liquid-bg)' : 'transparent',
                        border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--mat-liquid-border)'}`,
                        boxShadow: isSelected ? 'var(--mat-liquid-shadow)' : 'none',
                      }}
                    >
                      <div className="flex items-start gap-4 px-5 py-5">
                        {/* Category icon + radio */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{
                              background: 'var(--mat-liquid-bg)',
                              border: '1px solid var(--mat-liquid-border)',
                            }}
                          >
                            <CatIcon style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)', width: 18, height: 18 }} />
                          </div>
                          <input
                            type="radio"
                            id={`cat-${cat.id}`}
                            name="category"
                            value={cat.id}
                            checked={isSelected}
                            onChange={() => setSelected(cat.id)}
                            className="sr-only"
                          />
                          <div
                            className="h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                            style={{
                              borderColor: isSelected ? 'var(--border-strong)' : 'var(--mat-liquid-border)',
                              background: isSelected ? 'var(--text-primary)' : 'transparent',
                            }}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--bg-base)' }} />}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{cat.labels[l]}</span>
                            {cat.recommended && (
                              <span
                                className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)', color: 'var(--text-secondary)' }}
                              >
                                {p.catBadge}
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1.5">
                            {cat.features[l].map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-[12px]"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <Check
                                  className="flex-shrink-0"
                                  style={{ width: 12, height: 12, color: 'var(--text-tertiary)' }}
                                />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Registration type indicator */}
                        <div className={cn('shrink-0', isRtl ? '' : '')}>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-1"
                            style={{
                              borderColor: isSelected ? 'var(--border-strong)' : 'var(--mat-liquid-border)',
                              background: isSelected ? 'var(--text-primary)' : 'transparent',
                            }}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--bg-base)' }} />}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Right column: summary card ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
            className="lg:col-span-5"
          >
            <div
              className="sticky top-28 rounded-2xl p-6 space-y-5 relative overflow-hidden"
              style={{
                background: isLight ? 'rgba(245,245,247,0.8)' : '#0d0d0f',
                border: '1px solid var(--mat-liquid-border)',
                boxShadow: isLight
                  ? '0 2px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)'
                  : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Top accent line */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: 'var(--mat-liquid-border)' }}
              />

              <div>
                <h4 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{p.cardTitle}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.cardDesc}</p>
              </div>

              {/* Event meta */}
              <div className="space-y-2.5">
                {[
                  { icon: Calendar, text: p.date },
                  { icon: MapPin, text: p.location },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    {text}
                  </div>
                ))}
              </div>

              <div className="h-px" style={{ background: 'var(--mat-liquid-border)' }} />

              {/* Highlights */}
              <ul className="space-y-2">
                {[p.cardF2, p.cardF3].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                    <CircleCheck className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="h-px" style={{ background: 'var(--mat-liquid-border)' }} />

              {/* Selected category summary */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: 'var(--mat-liquid-bg)', border: '1px solid var(--mat-liquid-border)' }}
                  >
                    <Check className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div className="text-start">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      {p.selectedLabel ?? 'نوع المشاركة المختار'}
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {CATEGORIES.find(c => c.id === selected)?.labels[l]}
                    </p>
                  </div>
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
          className="mt-10"
        >
          <div className="h-px mb-8" style={{ background: 'var(--mat-liquid-border)' }} />

          {status === 'error' && (
            <p className="mb-4 text-center text-sm text-red-400">{errorMsg || p.errorMsg}</p>
          )}

          {/* Submit button — full width for formality */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-3.5 text-[15px] font-semibold text-white transition-all',
              'disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]',
            )}
            style={{
              background: isLight ? '#1a1a1e' : 'rgba(255,255,255,0.92)',
              color: isLight ? '#ffffff' : '#0d0d0f',
              boxShadow: isLight ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 16px rgba(255,255,255,0.08)',
            }}
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

          {/* Footer row: cancel + privacy note */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-[13px] font-medium transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" style={{ flexShrink: 0 }} />
              {p.btnCancel}
            </Link>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Lock style={{ width: 11, height: 11 }} />
              <span className="text-[11px]">{p.privacyNote ?? 'بياناتك محمية ولن تُشارك مع أي طرف ثالث'}</span>
            </div>
          </div>
        </motion.div>

        </div>{/* end form card */}
      </form>
    </div>
  );
}
