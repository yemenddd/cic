'use client';

import { motion } from 'framer-motion';
import { FinancialHero } from '@/components/ui/hero-section';
import FeatureCarousel from '@/components/ui/feature-carousel';
import { useLang } from '@/lib/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function BoldStatement() {
  const { t } = useLang();

  return (
    <section className="relative" style={{ background: 'var(--bg-base)' }}>

      {/* ── FinancialHero ── */}
      <FinancialHero
        titleLine1={t('bold.titleA')}
        titleLine2White={t('bold.titleMeet')}
        titleLine2Blue={t('bold.titleMachines')}
        description={t('bold.description')}
        description2={t('bold.description2')}
        buttonText={t('bold.explore')}
        buttonLink="/program"
        imageUrl1="/images/about/1.jpg"
        imageUrl2="/images/about/2.jpg"
      />

      {/* ── Who it's for ── */}
      <div className="relative py-16">
        <div className="max-w-7xl mx-auto px-6 w-full">

          {/* Headline */}
          <div className="text-center mb-8">
            <h3
              className="font-outfit font-bold tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)', lineHeight: 1.05 }}
            >
              <motion.span
                className="inline-block"
                style={{ color: 'var(--text-primary)' }}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                {t('bold.whoTitleA')}
              </motion.span>
              {' '}
              <motion.span
                className="inline-block gradient-text py-[0.15em]"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              >
                {t('bold.whoTitleB')}
              </motion.span>
            </h3>
          </div>

          <FeatureCarousel />
        </div>
      </div>

    </section>
  );
}
