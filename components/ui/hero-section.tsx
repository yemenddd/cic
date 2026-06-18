'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import Link from 'next/link';

export interface FinancialHeroProps {
  titleLine1: string;
  titleLine2White: string;
  titleLine2Blue: string;
  description: string;
  description2?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl1: string;
  imageUrl2: string;
  className?: string;
}

export const FinancialHero = ({
  titleLine1,
  titleLine2White,
  titleLine2Blue,
  description,
  description2,
  buttonText,
  buttonLink,
  imageUrl1,
  imageUrl2,
  className,
}: FinancialHeroProps) => {
  const { dir } = useLang();
  const isRtl = dir === 'rtl';

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const [currentP, setCurrentP] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setCurrentP(v));

  // Images start from the text column position and slide left to their natural place
  const imagesX = useTransform(scrollYProgress, [0, 0.5], [700, 0]);

  const reveal = (threshold: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 28 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  });

  const revealWord = (threshold: number) => ({
    initial: { opacity: 0, y: 48 },
    animate: { opacity: currentP >= threshold ? 1 : 0, y: currentP >= threshold ? 0 : 48 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div ref={sectionRef} className={cn('relative h-[200vh]', className)} style={{ overflowX: 'clip' }}>
      <div className="sticky top-0 h-screen w-full flex items-center">

        {/* Background decorations — overflow clipped here so content stays unclipped */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute -bottom-32 right-0 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)',
              filter: 'blur(70px)',
            }}
          />
          {/* Refined dot grid */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)',
              opacity: 0.25,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex items-center justify-between lg:flex-row flex-col gap-12">

          {/* ── Text — reveals while images are in motion ── */}
          <div className={cn('flex flex-col lg:w-[55%]', isRtl ? 'items-start text-right' : 'items-start text-left')}>

            <div className="mb-8" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className={cn(isRtl && 'text-right w-full')}>
                <motion.p
                  className="font-outfit font-bold tracking-[-0.03em]"
                  style={{
                    fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
                    lineHeight: 1,
                    paddingTop: '0.2em',
                    paddingBottom: '0.2em',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #A2A2A6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                  {...revealWord(0.15)}
                >
                  {titleLine1}
                </motion.p>
                <motion.p
                  className="font-outfit font-bold tracking-[-0.03em] gradient-text"
                  style={{
                    fontSize: 'clamp(2.8rem, 5.5vw, 5.5rem)',
                    lineHeight: 1.1,
                    paddingTop: '0.1em',
                    paddingBottom: '0.35em',
                  }}
                  {...revealWord(0.22)}
                >
                  {titleLine2White} {titleLine2Blue}
                </motion.p>
              </div>
            </div>

            <motion.div
              dir={isRtl ? 'rtl' : 'ltr'}
              className={cn('space-y-4 md:space-y-6 mb-8', isRtl ? 'w-full max-w-lg text-right ml-auto' : 'max-w-lg')}
              {...reveal(0.30)}
            >
              <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              {description2 && (
                <p className="text-[13px] md:text-[15px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{description2}</p>
              )}
            </motion.div>

            <motion.div className={cn('mt-2', isRtl && 'w-full text-right')} {...reveal(0.38)}>
              <Link
                href={buttonLink}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="inline-flex items-center gap-2 text-sm font-semibold group gradient-text"
              >
                {isRtl ? (
                  <>
                    <motion.div
                      animate={{ x: [0, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-blue-400"
                    >
                      <ArrowRight size={15} className="rotate-180" />
                    </motion.div>
                    {buttonText}
                  </>
                ) : (
                  <>
                    {buttonText}
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-blue-400"
                    >
                      <ArrowRight size={15} />
                    </motion.div>
                  </>
                )}
              </Link>
            </motion.div>
          </div>

          {/* ── Images — slide in from right, settle into position ── */}
          <motion.div
            className="relative lg:w-[45%] h-56 sm:h-72 lg:h-[420px] w-full flex items-center justify-center mt-4 lg:mt-0 overflow-visible px-4 lg:px-10"
            style={{ x: imagesX }}
            animate={{ opacity: currentP >= 0.04 ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img
              src={imageUrl2}
              alt=""
              className="absolute h-40 sm:h-56 md:h-[320px] w-auto rounded-2xl md:rounded-3xl object-cover transform rotate-[-4deg] translate-x-6 md:translate-x-12 translate-y-4 md:translate-y-6"
              style={{
                border:     '1px solid rgba(255,255,255,0.08)',
                boxShadow:  '0 24px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
              whileHover={{ y: -12, rotate: -3, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            />
            <motion.img
              src={imageUrl1}
              alt=""
              className="relative z-10 h-40 sm:h-56 md:h-[320px] w-auto rounded-2xl md:rounded-3xl object-cover transform rotate-[3deg] -translate-x-4 md:-translate-x-8"
              style={{
                border:     '1px solid rgba(255,255,255,0.10)',
                boxShadow:  '0 32px 80px rgba(0,0,0,0.65), 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
              whileHover={{ y: -12, rotate: 3, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
