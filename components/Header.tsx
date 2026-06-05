'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, Globe, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';

const navLinks = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'history', href: '/history' },
  { key: 'program', href: '/program' },
  { key: 'gallery', href: '/gallery' },
];

export default function Header() {
  const { t, lang, toggle } = useLang();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isHomePage = pathname === '/';
  const showBackground = !isHomePage || isScrolled;

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding,border-color,background] duration-500 border-b ${
        showBackground ? 'py-3 border-white/[0.08]' : 'py-5 border-transparent'
      }`}
      style={
        showBackground
          ? {
              background: 'rgba(3,7,18,0.80)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
            }
          : {}
      }
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            {/* glow ring on hover */}
            <span className="absolute inset-0 rounded-full bg-blue-500/25 blur-md scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <Image
              src="/logo_white.png"
              alt="CICT 2026"
              width={36}
              height={36}
              className="relative w-9 h-9 object-contain"
            />
          </motion.div>
          <div className="flex flex-col leading-none gap-[2px]">
            <span className="font-outfit font-bold text-[15px] tracking-tight text-white leading-none">
              {t('footer.copyright')}
            </span>
            <span className="text-[10px] text-white/35 tracking-[0.18em] uppercase font-medium">
              {t('nav.edition')}
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav
          className="hidden md:flex items-center gap-0.5"
          onMouseLeave={() => setHoveredLink(null)}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.key}
                href={link.href}
                onMouseEnter={() => setHoveredLink(link.key)}
                className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 select-none"
                style={{
                  color:
                    isActive
                      ? '#ffffff'
                      : hoveredLink === link.key
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.55)',
                }}
              >
                {/* sliding hover pill */}
                {hoveredLink === link.key && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                <span className="relative z-10">{t(`nav.${link.key}`)}</span>

                {/* active dot */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute bottom-[1px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right: date badge + CTA + mobile toggle ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Date badge — lg+ only */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <Calendar size={11} className="text-blue-400 shrink-0" />
            <span className="text-[11px] font-medium text-white/50 tracking-wide whitespace-nowrap">
              {t('nav.date')}
            </span>
          </div>

          {/* Language toggle dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-label="Switch language"
              className="flex items-center gap-1.5 px-3 py-[7px] rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <span className="text-[12px] font-semibold tracking-wide mt-[2px]">
                {lang === 'ar' ? 'العربية' : 'English'}
              </span>
              <Globe size={13} className="shrink-0" />
              <ChevronDown size={13} className={`shrink-0 opacity-60 transition-transform duration-200 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[120px] rounded-xl border border-white/10 bg-[#030712]/95 backdrop-blur-xl shadow-xl overflow-hidden py-1 z-50 flex flex-col items-stretch"
                >
                  <button
                    onClick={() => {
                      if (lang !== 'ar') toggle();
                      setIsLangMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => {
                      if (lang !== 'en') toggle();
                      setIsLangMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setIsLangMenuOpen(false);
                    }}
                    className="w-full text-center px-4 py-2 text-[13px] font-medium text-white/30 hover:bg-white/5 transition-colors cursor-not-allowed"
                    title="Coming soon"
                  >
                    Türkçe
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA — desktop */}
          <motion.a
            href="#register"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="hidden md:flex items-center px-5 py-[9px] rounded-full text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)' }}
          >
            {t('nav.register')}
          </motion.a>

          {/* Mobile hamburger */}
          <motion.button
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            whileTap={{ scale: 0.90 }}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                >
                  <X size={17} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                >
                  <Menu size={17} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.07] md:hidden"
            style={{
              background: 'rgba(3,7,18,0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
          >
            <div className="px-5 pt-4 pb-6 flex flex-col gap-0.5">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.045 + 0.04, duration: 0.28, ease: 'easeOut' }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                        isActive
                          ? 'text-white bg-white/[0.08]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {isActive && (
                        <span className="w-[5px] h-[5px] rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 shrink-0" />
                      )}
                      {t(`nav.${link.key}`)}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Bottom row */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.28 }}
                className="mt-3 pt-4 border-t border-white/[0.07] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-blue-400 shrink-0" />
                  <span className="text-[11px] text-white/40 tracking-wide">
                    {t('nav.date')} · {t('nav.location')}
                  </span>
                </div>
                <motion.a
                  href="#register"
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-full text-[13px] font-semibold text-white shrink-0"
                  style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)' }}
                >
                  {t('nav.registerShort')}
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
