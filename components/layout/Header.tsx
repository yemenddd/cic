'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/dictionary';
import { ShinyButton } from '@/components/ui/shiny-button';

const LANG_OPTIONS: { code: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe',  dir: 'ltr' },
];

const NAV_LINKS = [
  { key: 'home',         href: '/' },
  { key: 'about',        href: '/about' },
  { key: 'history',      href: '/history' },
  { key: 'program',      href: '/program' },
  { key: 'achievements', href: '/achievements' },
  { key: 'gallery',      href: '/gallery' },
  { key: 'videos',       href: '/videos' },
];

const SPRING = { type: 'spring', stiffness: 500, damping: 40 } as const;
const EASE   = [0.22, 1, 0.36, 1] as const;

export default function Header() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const langRef  = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLangOpen(false); setMenuOpen(false); }
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => { if (menuOpen) setLangOpen(false); }, [menuOpen]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isHome  = pathname === '/';
  const showBg  = !isHome || scrolled;

  /* ─────────────────────────────────────── */
  return (
    <>
      {/* ══════════════════════════════════
          Desktop / Tablet Header
      ══════════════════════════════════ */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={showBg ? {
          background:           'rgba(15, 15, 18, 0.75)',
          backdropFilter:       'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom:         '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow:            '0 4px 30px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.05)',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-[60px] flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="CICT Home">
            <Image
              src="/images/logos/logo_white.png"
              alt="CICT"
              width={32}
              height={32}
              priority
              className="w-[32px] h-[32px] object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
            />
            <span className="font-outfit font-bold text-[13px] text-white tracking-tight">
              {t('footer.copyright')}
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav
            className="hidden md:flex items-center gap-0"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_LINKS.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onMouseEnter={() => setHovered(link.key)}
                  className="relative px-3.5 py-2 rounded-lg text-[13px] font-medium select-none"
                  style={{
                    color: active
                      ? '#ffffff'
                      : hovered === link.key
                        ? 'rgba(255,255,255,0.90)'
                        : 'rgba(255,255,255,0.40)',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {/* Hover pill */}
                  {hovered === link.key && !active && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        boxShadow:  'inset 0 1px 0 rgba(255,255,255,0.06)',
                      }}
                      transition={SPRING}
                    />
                  )}

                  {/* Active pill background */}
                  {active && (
                    <motion.span
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        boxShadow:  'inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}
                      transition={SPRING}
                    />
                  )}

                  <span className="relative z-10">{t(`nav.${link.key}`)}</span>

                </Link>
              );
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Language switcher */}
            <div ref={langRef} className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(v => !v)}
                aria-label="Select language"
                aria-expanded={langOpen}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold select-none"
                style={{
                  color:                langOpen ? '#ffffff' : 'rgba(255,255,255,0.52)',
                  background:           langOpen ? 'rgba(20,20,26,0.85)' : 'rgba(15,15,18,0.55)',
                  backdropFilter:       'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border:               `1px solid ${langOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.06)',
                  transition:           'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Globe size={11} className="shrink-0 opacity-70" />
                <span className="tracking-widest">{lang.toUpperCase()}</span>
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center opacity-40"
                >
                  <ChevronDown size={10} />
                </motion.span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute top-full mt-2 z-50 w-44 rounded-2xl overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`}
                    style={{
                      background:           'rgba(8, 8, 12, 0.96)',
                      backdropFilter:       'blur(40px) saturate(160%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(160%)',
                      border:               '1px solid rgba(255,255,255,0.08)',
                      boxShadow:
                        '0 8px 40px rgba(0,0,0,0.60), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)',
                    }}
                  >
                    {LANG_OPTIONS.map((opt, i) => {
                      const isActive = lang === opt.code;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => { setLang(opt.code); setLangOpen(false); }}
                          dir={opt.dir}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-[12.5px]"
                          style={{
                            background:   isActive
                              ? 'linear-gradient(90deg,rgba(6,182,212,0.10),rgba(139,92,246,0.10))'
                              : 'transparent',
                            color:        isActive ? '#fff' : 'rgba(255,255,255,0.40)',
                            borderBottom: i < LANG_OPTIONS.length - 1
                              ? '1px solid rgba(255,255,255,0.05)'
                              : 'none',
                            transition:   'background 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (!isActive)
                              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={e => {
                            if (!isActive)
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md shrink-0"
                              style={{
                                background: isActive ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.06)',
                                color:      isActive ? '#67e8f9' : 'rgba(255,255,255,0.24)',
                              }}
                            >
                              {opt.code.toUpperCase()}
                            </span>
                            <span className="font-medium">{opt.label}</span>
                          </span>
                          {isActive && <Check size={11} className="shrink-0" style={{ color: '#67e8f9' }} />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Register CTA — desktop */}
            <div className="hidden md:flex">
              <ShinyButton href="/register">
                {t('nav.register')}
              </ShinyButton>
            </div>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
            >
              {[
                menuOpen ? { rotate: 45,  y: 3.5  } : { rotate: 0, y: 0 },
                menuOpen ? { opacity: 0,  scaleX: 0 } : { opacity: 1, scaleX: 1 },
                menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 },
              ].map((anim, i) => (
                <motion.span
                  key={i}
                  className="block h-[1.5px] w-[18px] bg-white rounded-full origin-center"
                  animate={anim}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════
          Full-screen Mobile Menu
      ══════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col"
            style={{
              background:           'rgba(4, 4, 8, 0.97)',
              backdropFilter:       'blur(40px) saturate(160%)',
              WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            }}
          >
            {/* Ambient orbs — give depth to the dark panel */}
            <div
              className="pointer-events-none absolute -top-32 -left-24 w-72 h-72 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
                filter:     'blur(40px)',
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
                filter:     'blur(50px)',
              }}
            />

            {/* Top bar */}
            <div
              className="relative flex items-center justify-between px-6 h-14 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <div
                  className="w-[28px] h-[28px] flex items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <Image
                    src="/images/logos/logo_white.png"
                    alt="CICT"
                    width={18}
                    height={18}
                    className="w-[18px] h-[18px] object-contain"
                  />
                </div>
                <span className="font-outfit font-bold text-[13px] text-white">{t('footer.copyright')}</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Close menu"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav
              className="relative flex-1 flex flex-col justify-center px-6 gap-0 overflow-y-auto"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              {NAV_LINKS.map((link, i) => {
                const active  = pathname === link.href;
                const slideX  = lang === 'ar' ? 16 : -16;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: slideX }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.36, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-4 group"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span
                        className="font-outfit font-bold tracking-tight"
                        style={{
                          fontSize: 'clamp(1.55rem, 5.5vw, 2rem)',
                          color:    active ? '#ffffff' : 'rgba(255,255,255,0.28)',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {t(`nav.${link.key}`)}
                      </span>
                      {active ? (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                            boxShadow:  '0 0 8px rgba(6,182,212,0.5)',
                          }}
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: 'rgba(255,255,255,0.12)' }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Language + CTA bottom strip */}
            <motion.div
              className="relative px-6 pt-5 pb-8 flex flex-col gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.3 }}
            >
              {/* Language label */}
              <p
                className="text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                Language
              </p>

              {/* Language grid */}
              <div className="grid grid-cols-3 gap-2">
                {LANG_OPTIONS.map(opt => {
                  const isActive = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => { setLang(opt.code); setMenuOpen(false); }}
                      dir={opt.dir}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-semibold active:scale-95"
                      style={{
                        background:  isActive
                          ? 'linear-gradient(135deg, rgba(6,182,212,0.16), rgba(139,92,246,0.16))'
                          : 'rgba(15,15,18,0.70)',
                        border:      `1px solid ${isActive ? 'rgba(103,232,249,0.25)' : 'rgba(255,255,255,0.07)'}`,
                        color:       isActive ? '#ffffff' : 'rgba(255,255,255,0.35)',
                        backdropFilter: 'blur(20px)',
                        boxShadow:   isActive ? 'inset 0 1px 0 rgba(255,255,255,0.10)' : 'none',
                        transition:  'all 0.2s ease',
                      }}
                    >
                      <span
                        className="text-[8.5px] font-black tracking-widest"
                        style={{ color: isActive ? '#67e8f9' : 'rgba(255,255,255,0.22)' }}
                      >
                        {opt.code.toUpperCase()}
                      </span>
                      <span>{opt.label}</span>
                      {isActive && <Check size={9} style={{ color: '#67e8f9' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Register button */}
              <div className="flex items-center justify-between pt-1 gap-4">
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {t('nav.date')}
                </span>
                <a
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-2.5 rounded-full text-[13.5px] font-semibold text-white shrink-0"
                  style={{
                    background:           'rgba(255,255,255,0.11)',
                    backdropFilter:       'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border:               '1px solid rgba(255,255,255,0.22)',
                    boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.12)',
                  }}
                >
                  {t('nav.register')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
