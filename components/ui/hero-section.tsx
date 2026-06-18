'use client';

import { motion } from 'framer-motion';
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

const EASE = [0.16, 1, 0.3, 1] as const;

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.55, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.65, delay, ease: EASE },
});

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

  return (
    <div className={cn('relative py-24 px-6', className)}>
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between lg:flex-row flex-col gap-12">

        {/* ── Text ── */}
        <div className={cn('flex flex-col lg:w-[55%]', isRtl ? 'items-start text-right' : 'items-start text-left')}>

          <div className="mb-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className={cn(isRtl && 'text-right w-full')}>
              <motion.p
                className="font-outfit font-bold tracking-[-0.03em]"
                style={{
                  fontSize:             'clamp(2.8rem, 5.5vw, 5.5rem)',
                  lineHeight:           1,
                  paddingTop:           '0.2em',
                  paddingBottom:        '0.2em',
                  background:           'var(--metallic-grad)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor:  'transparent',
                  backgroundClip:       'text',
                }}
                {...inViewWord(0)}
              >
                {titleLine1}
              </motion.p>
              <motion.p
                className="font-outfit font-bold tracking-[-0.03em] gradient-text"
                style={{
                  fontSize:      'clamp(2.8rem, 5.5vw, 5.5rem)',
                  lineHeight:    1.1,
                  paddingTop:    '0.1em',
                  paddingBottom: '0.35em',
                }}
                {...inViewWord(0.1)}
              >
                {titleLine2White} {titleLine2Blue}
              </motion.p>
            </div>
          </div>

          <motion.div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={cn('space-y-4 md:space-y-6 mb-8', isRtl ? 'w-full max-w-lg text-right ml-auto' : 'max-w-lg')}
            {...inView(0.2)}
          >
            <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{description}</p>
            {description2 && (
              <p className="text-[13px] md:text-[15px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{description2}</p>
            )}
          </motion.div>

          <motion.div className={cn('mt-2', isRtl && 'w-full text-right')} {...inView(0.28)}>
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

        {/* ── Images ── */}
        <motion.div
          className="relative lg:w-[45%] h-56 sm:h-72 lg:h-[420px] w-full flex items-center justify-center mt-4 lg:mt-0 overflow-visible px-4 lg:px-10"
          initial={{ opacity: 0, x: isRtl ? -60 : 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <motion.img
            src={imageUrl2}
            alt=""
            className="absolute h-40 sm:h-56 md:h-[320px] w-auto rounded-2xl md:rounded-3xl object-cover transform rotate-[-4deg] translate-x-6 md:translate-x-12 translate-y-4 md:translate-y-6"
            style={{
              border:    '1px solid var(--mat-liquid-border)',
              boxShadow: 'var(--shadow-md)',
            }}
            whileHover={{ y: -12, rotate: -3, transition: { duration: 0.4, ease: EASE } }}
          />
          <motion.img
            src={imageUrl1}
            alt=""
            className="relative z-10 h-40 sm:h-56 md:h-[320px] w-auto rounded-2xl md:rounded-3xl object-cover transform rotate-[3deg] -translate-x-4 md:-translate-x-8"
            style={{
              border:    '1px solid var(--mat-liquid-border)',
              boxShadow: 'var(--shadow-lg)',
            }}
            whileHover={{ y: -12, rotate: 3, transition: { duration: 0.4, ease: EASE } }}
          />
        </motion.div>
      </div>
    </div>
  );
};
