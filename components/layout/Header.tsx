'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/dictionary';
import ThemeToggle from '@/components/layout/ThemeToggle';

const LANG_OPTIONS: { code: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe',  dir: 'ltr' },
];

const navLinks = [
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
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [hovered, setHovered]     = useState<string | null>(null);
  const [langOpen, setLangOpen]   = useState(false);
  const langRef                   = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && resolvedTheme === 'light'
    ? '/images/logos/logo_colored.png'
    : '/images/logos/logo_white.png';

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLangOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => { if (menuOpen) setLangOpen(false); }, [menuOpen]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
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
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={showBg ? {
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--header-border)',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-16 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image
              src={logoSrc}
              alt="CICT"
              width={32}
              height={32}
              priority
              className="w-8 h-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="flex flex-col leading-none">
              <span
                className="font-outfit font-bold text-[13px] tracking-tight"
                style={{ color: 'var(--nav-text-active)' }}
              >
                {t('footer.copyright')}
              </span>
              <span
                className="text-[9px] tracking-[0.16em] uppercase mt-[2px]"
                style={{ color: 'var(--nav-text-muted)' }}
              >
                {t('nav.edition')}
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ── */}
          <nav
            className="hidden md:flex items-center gap-0.5 px-1.5 py-1.5"
            onMouseLeave={() => setHovered(null)}
          >
            {navLinks.map(link => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onMouseEnter={() => setHovered(link.key)}
                  className="relative px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-100 select-none"
                  style={{ color: active ? 'var(--nav-text-active)' : hovered === link.key ? 'var(--nav-text-hover)' : 'var(--nav-text)' }}
                >
                  {hovered === link.key && !active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md"
                      style={{ background: 'var(--nav-pill-bg)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{t(`nav.${link.key}`)}</span>
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(v => !v)}
                aria-label="Select language"
                aria-expanded={langOpen}
                className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors text-[11px] font-semibold select-none"
                style={{
                  color: 'var(--lang-btn-text)',
                  border: `1px solid ${langOpen ? 'var(--lang-btn-border-open)' : 'var(--lang-btn-border)'}`,
                  background: langOpen ? 'var(--lang-btn-bg-open)' : 'transparent',
                }}
              >
                <Globe size={11} className="shrink-0" />
                <span className="tracking-wide">{lang.toUpperCase()}</span>
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <ChevronDown size={10} className="opacity-50" />
                </motion.span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute top-full mt-1.5 z-50 w-[152px] rounded-xl overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`}
                    style={{
                      background: 'var(--lang-dropdown-bg)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid var(--lang-dropdown-border)',
                      boxShadow: 'var(--lang-dropdown-shadow)',
                    }}
                  >
                    {LANG_OPTIONS.map((opt, i) => {
                      const active = lang === opt.code;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => { setLang(opt.code); setLangOpen(false); }}
                          dir={opt.dir}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[12px] transition-colors duration-150"
                          style={{
                            background: active ? 'linear-gradient(90deg, rgba(6,182,212,0.13), rgba(139,92,246,0.13))' : 'transparent',
                            color: active ? 'var(--nav-text-active)' : 'var(--lang-item-text)',
                            borderBottom: i < LANG_OPTIONS.length - 1 ? '1px solid var(--lang-item-border)' : 'none',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--lang-item-hover-bg)'; }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="text-[9px] font-black tracking-widest px-1 py-0.5 rounded shrink-0"
                              style={{
                                background: active ? 'rgba(6,182,212,0.2)' : 'var(--lang-code-bg)',
                                color: active ? 'var(--lang-active-check)' : 'var(--lang-code-text)',
                              }}
                            >
                              {opt.code.toUpperCase()}
                            </span>
                            <span className="font-medium">{opt.label}</span>
                          </span>
                          {active && <Check size={11} style={{ color: 'var(--lang-active-check)' }} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* CTA — desktop */}
            <motion.a
              href="/register"
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 px-4 py-[7px] text-[12px] font-bold text-white select-none"
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #060e1f, #0c1a35)',
                border: '1px solid rgba(6,182,212,0.45)',
                boxShadow: '0 0 10px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#22d3ee',
                boxShadow: '0 0 7px #22d3ee',
                flexShrink: 0,
              }} />
              {t('nav.register')}
            </motion.a>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg"
            >
              <motion.span
                className="block h-[1.5px] w-5 rounded-full origin-center bg-[var(--nav-text-active)]"
                animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-[1.5px] w-5 rounded-full bg-[var(--nav-text-active)]"
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                className="block h-[1.5px] w-5 rounded-full origin-center bg-[var(--nav-text-active)]"
                animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Full-screen mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden flex flex-col"
            style={{ background: 'var(--mobile-menu-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-5 h-14">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image src={logoSrc} alt="CICT" width={28} height={28} className="w-7 h-7 object-contain" />
                <span
                  className="font-outfit font-bold text-[13px]"
                  style={{ color: 'var(--nav-text-active)' }}
                >
                  {t('footer.copyright')}
                </span>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-100 opacity-60"
                style={{ color: 'var(--nav-text-active)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 flex flex-col justify-center px-8 gap-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {navLinks.map((link, i) => {
                const active = pathname === link.href;
                const slideX = lang === 'ar' ? 24 : -24;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: slideX }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-4 border-b group"
                      style={{ borderColor: 'var(--mobile-border)' }}
                    >
                      <span
                        className={`font-outfit font-bold transition-opacity ${active ? '' : 'opacity-40 group-hover:opacity-100'}`}
                        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: 'var(--nav-text-active)' }}
                      >
                        {t(`nav.${link.key}`)}
                      </span>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 shrink-0" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Language selector */}
            <motion.div
              className="px-8 pb-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
                style={{ color: 'var(--mobile-text-muted)' }}
              >
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
                      className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95"
                      style={active ? {
                        background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))',
                        border: '1px solid rgba(103,232,249,0.3)',
                        color: 'var(--nav-text-active)',
                      } : {
                        background: 'var(--mobile-lang-inactive-bg)',
                        border: '1px solid var(--mobile-lang-inactive-bdr)',
                        color: 'var(--mobile-lang-inactive-text)',
                      }}
                    >
                      <span
                        className="text-[10px] font-black tracking-widest"
                        style={{ color: active ? 'var(--lang-active-check)' : 'var(--lang-code-text)' }}
                      >
                        {opt.code.toUpperCase()}
                      </span>
                      <span>{opt.label}</span>
                      {active && <Check size={10} style={{ color: 'var(--lang-active-check)' }} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Bottom */}
            <motion.div
              className="px-8 pb-10 flex items-center justify-between"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.3 }}
            >
              <span
                className="text-[12px] tracking-wide"
                style={{ color: 'var(--mobile-text-muted)' }}
              >
                {t('nav.date')}
              </span>
              <a
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)' }}
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
