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

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Header() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered]   = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const langRef  = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* Close lang dropdown on outside click / Escape */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLangOpen(false); setMenuOpen(false); } };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
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

  const isHome = pathname === '/';
  const showBg = !isHome || scrolled;

  return (
    <>
      {/* ═══════════════════════════════════
          Desktop / Tablet Header
      ═══════════════════════════════════ */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="fixed top-0 inset-x-0 z-50"
        style={showBg ? {
          background:            'rgba(0,0,0,0.72)',
          backdropFilter:        'blur(32px) saturate(180%)',
          WebkitBackdropFilter:  'blur(32px) saturate(180%)',
          borderBottom:          '1px solid rgba(255,255,255,0.07)',
          boxShadow:             '0 1px 0 rgba(255,255,255,0.04) inset',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-[60px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="CICT Home">
            <Image
              src="/images/logos/logo_white.png"
              alt="CICT"
              width={30}
              height={30}
              priority
              className="w-[30px] h-[30px] object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-200"
            />
            <div className="flex flex-col leading-none gap-[2px]">
              <span className="font-outfit font-bold text-[12.5px] text-white tracking-tight">
                {t('footer.copyright')}
              </span>
              <span className="text-[8.5px] tracking-[0.18em] uppercase"
                    style={{ color: 'var(--text-tertiary)' }}>
                {t('nav.edition')}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-0.5"
            onMouseLeave={() => setHovered(null)}
          >
            {NAV_LINKS.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onMouseEnter={() => setHovered(link.key)}
                  className="relative px-3.5 py-2 rounded-lg text-[13px] font-medium select-none transition-colors duration-100"
                  style={{
                    color: active
                      ? '#ffffff'
                      : hovered === link.key
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {/* Hover background pill */}
                  {hovered === link.key && !active && (
                    <motion.span
                      layoutId="nav-hover"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}

                  <span className="relative z-10">{t(`nav.${link.key}`)}</span>

                  {/* Active dot — gradient */}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                      style={{
                        width: '70%',
                        background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Language switcher */}
            <div ref={langRef} className="relative hidden md:block">
              <button
                onClick={() => setLangOpen(v => !v)}
                aria-label="Select language"
                aria-expanded={langOpen}
                className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[11px] font-semibold select-none transition-all duration-150"
                style={{
                  color:      langOpen ? '#ffffff' : 'rgba(255,255,255,0.65)',
                  border:     `1px solid ${langOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.09)'}`,
                  background: langOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
                }}
              >
                <Globe size={11} className="shrink-0" />
                <span className="tracking-widest">{lang.toUpperCase()}</span>
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center opacity-50"
                >
                  <ChevronDown size={10} />
                </motion.span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{    opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute top-full mt-2 z-50 w-40 rounded-2xl overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`}
                    style={{
                      background:           'rgba(6,6,14,0.95)',
                      backdropFilter:       'blur(32px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                      border:               '1px solid rgba(255,255,255,0.09)',
                      boxShadow:            '0 16px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  >
                    {LANG_OPTIONS.map((opt, i) => {
                      const active = lang === opt.code;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => { setLang(opt.code); setLangOpen(false); }}
                          dir={opt.dir}
                          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-[12px] transition-colors duration-120"
                          style={{
                            background:  active ? 'linear-gradient(90deg,rgba(6,182,212,0.12),rgba(139,92,246,0.12))' : 'transparent',
                            color:       active ? '#fff' : 'rgba(255,255,255,0.42)',
                            borderBottom: i < LANG_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="text-[8.5px] font-black tracking-widest px-1 py-0.5 rounded shrink-0"
                              style={{
                                background: active ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.06)',
                                color:      active ? '#67e8f9' : 'rgba(255,255,255,0.28)',
                              }}
                            >
                              {opt.code.toUpperCase()}
                            </span>
                            <span className="font-medium">{opt.label}</span>
                          </span>
                          {active && <Check size={11} className="shrink-0" style={{ color: '#67e8f9' }} />}
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
                menuOpen ? { rotate: 45,   y: 3.5  } : { rotate: 0, y: 0 },
                menuOpen ? { opacity: 0, scaleX: 0  } : { opacity: 1, scaleX: 1 },
                menuOpen ? { rotate: -45,  y: -3.5  } : { rotate: 0, y: 0 },
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

      {/* ═══════════════════════════════════
          Full-screen Mobile Menu
      ═══════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col"
            style={{
              background:           'rgba(0,0,0,0.97)',
              backdropFilter:       'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 h-14 shrink-0">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image src="/images/logos/logo_white.png" alt="CICT" width={26} height={26} className="w-[26px] h-[26px] object-contain" />
                <span className="font-outfit font-bold text-[12.5px] text-white">{t('footer.copyright')}</span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center"
                aria-label="Close menu"
              >
                <span className="relative w-[18px] h-[18px]">
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block h-[1.5px] w-[18px] bg-white/60 rounded-full origin-center rotate-45" />
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block h-[1.5px] w-[18px] bg-white/60 rounded-full origin-center -rotate-45" />
                  </span>
                </span>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col justify-center px-7 gap-0.5 overflow-y-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {NAV_LINKS.map((link, i) => {
                const active  = pathname === link.href;
                const slideX  = lang === 'ar' ? 20 : -20;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: slideX }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055, duration: 0.32, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-[14px] border-b group"
                      style={{ borderColor: 'rgba(255,255,255,0.055)' }}
                    >
                      <span
                        className={`font-outfit font-bold transition-colors duration-200 ${active ? 'text-white' : 'text-white/35 group-hover:text-white/80'}`}
                        style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2rem)' }}
                      >
                        {t(`nav.${link.key}`)}
                      </span>
                      {active && (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))' }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Language selector */}
            <motion.div
              className="px-7 pb-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.3 }}
            >
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] mb-3"
                 style={{ color: 'var(--text-disabled)' }}>
                Language
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LANG_OPTIONS.map(opt => {
                  const active = lang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      onClick={() => { setLang(opt.code); setMenuOpen(false); }}
                      dir={opt.dir}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl text-[11px] font-semibold active:scale-95 transition-transform duration-100"
                      style={active ? {
                        background: 'linear-gradient(135deg,rgba(6,182,212,0.18),rgba(139,92,246,0.18))',
                        border:     '1px solid rgba(103,232,249,0.28)',
                        color:      '#ffffff',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border:     '1px solid rgba(255,255,255,0.07)',
                        color:      'rgba(255,255,255,0.38)',
                      }}
                    >
                      <span className="text-[9px] font-black tracking-widest"
                            style={{ color: active ? '#67e8f9' : 'rgba(255,255,255,0.28)' }}>
                        {opt.code.toUpperCase()}
                      </span>
                      <span>{opt.label}</span>
                      {active && <Check size={9} style={{ color: '#67e8f9' }} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              className="px-7 pb-10 flex items-center justify-between"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              <span className="text-[11.5px] tracking-wide" style={{ color: 'var(--text-disabled)' }}>
                {t('nav.date')}
              </span>
              <a
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="px-6 py-2.5 rounded-full text-[13.5px] font-semibold text-white"
                style={{
                  background:           'rgba(255,255,255,0.12)',
                  backdropFilter:       'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border:               '1px solid rgba(255,255,255,0.28)',
                  boxShadow:            'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.12)',
                }}
              >
                {t('nav.register')}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
