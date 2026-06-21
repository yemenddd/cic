'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const isScrolledDown = scrollY > 400;
      // Use a larger threshold (e.g. 400px) so it hides as soon as the footer comes into view
      const scrollHeight = Math.max(document.body.offsetHeight, document.documentElement.scrollHeight);
      const isAtBottom = (window.innerHeight + scrollY) >= scrollHeight - 400;
      setVisible(isScrolledDown && !isAtBottom);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          onClick={scrollUp}
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.85 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.93 }}
          className="fixed bottom-8 right-8 z-50 group outline-none focus:outline-none"
        >

          {/* Button body */}
          <span
            className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden"
            style={{
              background: isLight ? 'rgba(30,27,50,0.90)' : 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isLight ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: 'none',
            }}
          >
            {/* Subtle gradient fill on hover */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
              }}
            />

            {/* Arrow SVG — animates up on hover */}
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`relative w-5 h-5 transition-colors duration-200 ${isLight ? 'stroke-white/90 group-hover:stroke-white' : 'stroke-black/70 group-hover:stroke-black'}`}
              animate={{ y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <polyline points="18 15 12 9 6 15" />
            </motion.svg>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
