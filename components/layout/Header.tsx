'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/i18n';

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
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [hovered, setHovered]         = useState<string | null>(null);
  const pathname = usePathname();

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
            <Image src="/images/logos/logo_white.png" alt="CICT" width={32} height={32}
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

            {/* Language toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle language"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white/50 hover:text-white transition-colors text-[12px] font-medium"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Globe size={12} />
              <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            {/* CTA — desktop */}
            <motion.a
              href="#register"
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
                return (
                  <motion.div
                    key={link.key}
                    initial={{ opacity: 0, x: lang === 'ar' ? 24 : -24 }}
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

            {/* Bottom */}
            <motion.div
              className="px-8 pb-10 flex items-center justify-between"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              <span className="text-[12px] text-white/25 tracking-wide">{t('nav.date')}</span>
              <a
                href="#register"
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
