'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';
import type { Lang } from '@/lib/dictionary';

const LANG_OPTIONS: { code: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe',  dir: 'ltr' },
];

const navLinks = [
  { key: 'home',    href: '/' },
  { key: 'about',   href: '/about' },
  { key: 'history', href: '/history' },
  { key: 'program', href: '/program' },
  { key: 'gallery', href: '/gallery' },
  { key: 'videos', href: '/videos' },
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

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLangOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, []);

  // Close dropdown whenever the mobile menu opens
  useEffect(() => { if (menuOpen) setLangOpen(false); }, [menuOpen]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu is open
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
          background: 'rgba(3,7,18,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        } : {}}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 md:h-16 flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/images/logos/logo_white.png" alt="CICT" width={32} height={32} priority
              className="w-8 h-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col leading-none">
              <span className="font-outfit font-bold text-[13px] text-white tracking-tight">
                {t('footer.copyright')}
              </span>
              <span className="text-[9px] text-white/30 tracking-[0.16em] uppercase mt-[2px]">
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
                  style={{ color: active ? '#fff' : hovered === link.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}
                >
                  {hovered === link.key && !active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
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
                className="flex items-center gap-1 px-2 py-1 rounded-full text-white/70 hover:text-white transition-colors text-[11px] font-semibold select-none"
                style={{ border: `1px solid ${langOpen ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`, background: langOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
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
                    /* Anchor left when RTL (button is on left), right when LTR (button is on right) */
                    className={`absolute top-full mt-1.5 z-50 w-[152px] rounded-xl overflow-hidden ${lang === 'ar' ? 'left-0' : 'right-0'}`}
                    style={{
                      background: 'rgba(8,12,26,0.96)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04)',
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
                            color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                            borderBottom: i < LANG_OPTIONS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="text-[9px] font-black tracking-widest px-1 py-0.5 rounded shrink-0"
                              style={{ background: active ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.07)', color: active ? '#67e8f9' : 'rgba(255,255,255,0.3)' }}
                            >
                              {opt.code.toUpperCase()}
                            </span>
                            <span className="font-medium">{opt.label}</span>
                          </span>
                          {active && <Check size={11} style={{ color: '#67e8f9' }} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA — desktop */}
            <motion.a
              href="/register"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center px-4 py-1.5 rounded-full text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)' }}
            >
              {t('nav.register')}
            </motion.a>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg"
            >
              <motion.span
                className="block h-[1.5px] w-5 bg-white rounded-full origin-center"
                animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-[1.5px] w-5 bg-white rounded-full"
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.15 }}
              />
              <motion.span
                className="block h-[1.5px] w-5 bg-white rounded-full origin-center"
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
            style={{ background: 'rgba(3,7,18,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-5 h-14">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
                <Image src="/images/logos/logo_white.png" alt="CICT" width={28} height={28} className="w-7 h-7 object-contain" />
                <span className="font-outfit font-bold text-[13px] text-white">{t('footer.copyright')}</span>
              </Link>
              <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white">
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
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <span className={`font-outfit font-bold transition-colors ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`}
                        style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)' }}>
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25 mb-3">
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
                        color: '#fff',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <span
                        className="text-[10px] font-black tracking-widest"
                        style={{ color: active ? '#67e8f9' : 'rgba(255,255,255,0.3)' }}
                      >
                        {opt.code.toUpperCase()}
                      </span>
                      <span>{opt.label}</span>
                      {active && <Check size={10} style={{ color: '#67e8f9' }} />}
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
              <span className="text-[12px] text-white/25 tracking-wide">{t('nav.date')}</span>
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
