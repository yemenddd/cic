'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/dictionary';
import { useTheme } from '@/lib/theme-context';
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
  const { theme, toggle: toggleTheme } = useTheme();
  const isLight = theme === 'light';
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

  const isHome    = pathname === '/';
  const showBg    = !isHome || scrolled;
  // When header is transparent (home, not scrolled) it sits over a dark photo → always white
  const overDark  = isHome && !scrolled;

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
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${menuOpen ? 'opacity-0 pointer-events-none' : ''}`}
        style={showBg ? {
          background:           'var(--header-glass-bg)',
          backdropFilter:       'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom:         '1px solid var(--header-glass-border)',
          boxShadow:            'var(--header-glass-shadow)',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-[60px] flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="CICT Home">
            <Image
              src={(overDark || !isLight) ? "/images/logos/logo_white.png" : "/images/logos/logo_colored.png"}
              alt="CICT"
              width={32}
              height={32}
              priority
              className="w-[32px] h-[32px] object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
            />
            <span className="font-outfit font-bold text-[13px] tracking-tight" style={{ color: overDark ? 'rgba(255,255,255,0.88)' : 'var(--text-primary)' }}>
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
                    color: overDark
                    ? (active ? '#ffffff' : hovered === link.key ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.52)')
                    : (active ? 'var(--text-primary)' : hovered === link.key ? 'var(--text-secondary)' : 'var(--text-tertiary)'),
                    transition: 'color 0.15s ease',
                  }}
                >
                  {/* Hover pill */}
                  {hovered === link.key && !active && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'var(--nav-hover-bg)',
                        boxShadow:  'inset 0 1px 0 var(--mat-liquid-inset)',
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
                        background: 'var(--nav-active-bg)',
                        boxShadow:  'inset 0 1px 0 var(--mat-liquid-inset)',
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

            {/* Theme toggle — sun | pill | moon */}
            <button
              onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              className="hidden md:flex items-center gap-1.5 select-none"
              dir="ltr"
            >
              <Sun
                size={13}
                style={{
                  color:      overDark ? 'rgba(255,255,255,0.55)' : 'var(--text-tertiary)',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  position:   'relative',
                  width:       38,
                  height:      21,
                  borderRadius: 99,
                  background:  overDark
                    ? 'rgba(255,255,255,0.12)'
                    : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
                  border:      overDark
                    ? '1px solid rgba(255,255,255,0.20)'
                    : '1px solid var(--mat-liquid-border)',
                  display:    'flex',
                  alignItems: 'center',
                  padding:    '2.5px',
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                  cursor:     'pointer',
                }}
              >
                <div
                  style={{
                    width:      15,
                    height:     15,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow:  '0 1px 3px rgba(0,0,0,0.30)',
                    transform:  `translateX(${isLight ? 0 : 18}px)`,
                    transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
                    flexShrink: 0,
                  }}
                />
              </div>
              <Moon
                size={13}
                style={{
                  color:      overDark ? 'rgba(255,255,255,0.55)' : 'var(--text-tertiary)',
                  transition: 'color 0.2s',
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Language switcher */}
            <div ref={langRef} className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(v => !v)}
                aria-label="Select language"
                aria-expanded={langOpen}
                className="flex items-center gap-1.5 px-3 py-[6px] rounded-full text-[11px] font-semibold select-none"
                style={{
                  color:                overDark ? (langOpen ? '#ffffff' : 'rgba(255,255,255,0.62)') : (langOpen ? 'var(--text-primary)' : 'var(--text-tertiary)'),
                  background:           overDark ? 'rgba(255,255,255,0.10)' : 'var(--mat-liquid-bg)',
                  backdropFilter:       'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border:               overDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--mat-liquid-border)',
                  boxShadow:            overDark ? 'none' : 'inset 0 1px 0 var(--mat-liquid-inset)',
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
                      background:           isLight ? 'rgba(242,242,247,0.98)' : 'rgba(18,18,22,0.97)',
                      backdropFilter:       'blur(80px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(80px) saturate(200%)',
                      border:               '1px solid var(--header-glass-border)',
                      boxShadow:            '0 2px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    {LANG_OPTIONS.map((opt, i) => {
                      const isActive = lang === opt.code;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => { setLang(opt.code); setLangOpen(false); }}
                          dir={opt.dir}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[12.5px]"
                          style={{
                            background:   isActive
                              ? 'var(--nav-hover-bg)'
                              : 'transparent',
                            color:        isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            borderBottom: i < LANG_OPTIONS.length - 1
                              ? '1px solid var(--header-glass-border)'
                              : 'none',
                            transition:   'background 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            if (!isActive)
                              (e.currentTarget as HTMLElement).style.background = 'var(--nav-hover-bg)';
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
                                background: isActive ? 'var(--nav-active-bg)' : 'var(--nav-hover-bg)',
                                color:      isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                              }}
                            >
                              {opt.code.toUpperCase()}
                            </span>
                            <span className="font-medium">{opt.label}</span>
                          </span>
                          {isActive && <Check size={11} className="shrink-0" style={{ color: 'var(--text-primary)' }} />}
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
                  className="block h-[1.5px] w-[18px] rounded-full origin-center"
                  style={{ backgroundColor: overDark ? 'rgba(255,255,255,0.88)' : 'var(--text-primary)' }}
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
              background:           isLight ? 'rgba(248,248,250,0.97)' : 'rgba(10,10,16,0.97)',
              backdropFilter:       'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            }}
          >

            {/* Top bar */}
            <div
              className="relative flex items-center justify-between px-6 h-14 shrink-0"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              style={{ borderBottom: '1px solid var(--mat-black-border)' }}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <div
                  className="w-[28px] h-[28px] flex items-center justify-center rounded-lg shrink-0"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <Image
                    src={isLight ? "/images/logos/logo_colored.png" : "/images/logos/logo_white.png"}
                    alt="CICT"
                    width={18}
                    height={18}
                    className="w-[18px] h-[18px] object-contain"
                  />
                </div>
                <span className="font-outfit font-bold text-[13px]" style={{ color: isLight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.88)' }}>{t('footer.copyright')}</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                style={{
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.10)',
                }}
                aria-label="Close menu"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke={isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)'} strokeWidth="1.5" strokeLinecap="round"/>
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
                      style={{ borderBottom: isLight ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <span
                        className="font-outfit font-bold tracking-tight"
                        style={{
                          fontSize: 'clamp(1.55rem, 5.5vw, 2rem)',
                          color: active
                            ? (isLight ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)')
                            : (isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'),
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {t(`nav.${link.key}`)}
                      </span>
                      {active ? (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: 'var(--text-tertiary)', opacity: 0.7 }}
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: 'var(--border-subtle)' }}
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
              style={{ borderTop: '1px solid var(--border-subtle)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.3 }}
            >
              {/* Language label */}
              <p
                className="text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--text-tertiary)' }}
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
                        background:  isActive ? 'var(--nav-active-bg)' : 'var(--mat-liquid-bg)',
                        border:      `1px solid ${isActive ? 'var(--border-strong)' : 'var(--mat-liquid-border)'}`,
                        color:       isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        backdropFilter: 'blur(20px)',
                        boxShadow:   isActive ? 'inset 0 1px 0 var(--mat-liquid-inset)' : 'none',
                        transition:  'all 0.2s ease',
                      }}
                    >
                      <span
                        className="text-[8.5px] font-black tracking-widest"
                        style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                      >
                        {opt.code.toUpperCase()}
                      </span>
                      <span>{opt.label}</span>
                      {isActive && <Check size={9} style={{ color: 'var(--text-secondary)' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Theme + Register row */}
              <div className="flex items-center justify-between pt-1 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {t('nav.date')}
                  </span>
                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                    className="flex w-9 h-9 items-center justify-center rounded-full shrink-0"
                    style={{
                      background:           'var(--mat-liquid-bg)',
                      backdropFilter:       'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border:               '1px solid var(--mat-liquid-border)',
                      color:                'var(--text-secondary)',
                      boxShadow:            'inset 0 1px 0 var(--mat-liquid-inset)',
                    }}
                  >
                    {isLight ? <Moon size={14} /> : <Sun size={14} />}
                  </button>
                </div>
                <a
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-6 py-2.5 rounded-full text-[13.5px] font-semibold shrink-0"
                  style={{
                    background:           'var(--mat-liquid-bg)',
                    backdropFilter:       'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border:               '1px solid var(--mat-liquid-border)',
                    color:                'var(--text-primary)',
                    boxShadow:            'inset 0 1px 0 var(--mat-liquid-inset)',
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
