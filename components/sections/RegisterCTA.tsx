'use client';

import { motion } from 'framer-motion';
import { CtaCard } from '@/components/ui/cta-card';
import { useLang } from '@/lib/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

const inView = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.5, delay, ease: EASE },
});

const inViewWord = (delay = 0) => ({
  initial:     { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.2 },
  transition:  { duration: 0.6, delay, ease: EASE },
});

export default function RegisterCTA() {
  const { t } = useLang();

  return (
    <section
      id="register"
      className="relative py-14 md:py-32 flex items-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="max-w-5xl mx-auto px-6 w-full text-center">

        {/* Headline */}
        <h2
          className="font-outfit font-bold tracking-tight leading-[0.9] mb-6"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}
        >
          <motion.span className="block" style={{ color: 'var(--text-primary)' }} {...inViewWord(0)}>
            {t('register.titleA')}
          </motion.span>
          <motion.span
            className="inline-block gradient-text py-[0.2em] leading-[1.1]"
            style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.8rem)' }}
            {...inViewWord(0.08)}
          >
            {t('register.titleB')}
          </motion.span>
        </h2>

        {/* Subtext */}
        <motion.p
          className="text-base md:text-lg max-w-md mx-auto mb-14 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
          {...inView(0.14)}
        >
          {t('register.subtext')}
        </motion.p>

        {/* CTA Card */}
        <motion.div {...inView(0.26)}>
          <CtaCard
            imageSrc="/images/CTA/CTA1.png"
            titleA={t('register.cardTitleA')}
            titleB={t('register.cardTitleB')}
            description={t('register.cardSubtext')}
            buttonText={t('register.register')}
            href="/register"
          />
        </motion.div>

      </div>
    </section>
  );
}
