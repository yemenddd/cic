'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

const EASE = [0.22, 1, 0.36, 1] as const;

const CONTENT = {
  ar: {
    code:    '٤٠٤',
    title:   'الصفحة غير موجودة',
    desc:    'يبدو أن هذه الصفحة غير موجودة أو تم نقلها. تحقق من الرابط أو عد إلى الرئيسية.',
    home:    'العودة إلى الرئيسية',
    program: 'استعرض البرنامج',
  },
  en: {
    code:    '404',
    title:   'Page not found',
    desc:    'This page doesn\'t exist or has been moved. Check the URL or head back home.',
    home:    'Back to Home',
    program: 'View Program',
  },
  tr: {
    code:    '404',
    title:   'Sayfa bulunamadı',
    desc:    'Bu sayfa mevcut değil veya taşınmış olabilir. URL\'yi kontrol edin ya da ana sayfaya dönün.',
    home:    'Ana Sayfaya Dön',
    program: 'Programı İncele',
  },
} as const;

export default function NotFound() {
  const { lang, dir } = useLang();
  const isRtl = dir === 'rtl';
  const c = CONTENT[lang as keyof typeof CONTENT] ?? CONTENT.ar;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-md"
      >
        <Empty className="border-white/8 bg-white/[0.02]">

          {/* Icon / 404 visual */}
          <EmptyMedia>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
              className="relative flex h-24 w-24 items-center justify-center"
            >
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.12))',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              />
              {/* Inner glow pulse */}
              <motion.div
                className="absolute inset-3 rounded-full"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Compass
                className="relative z-10 h-10 w-10"
                style={{ color: 'rgba(139,92,246,0.8)' }}
                strokeWidth={1.5}
              />
            </motion.div>
          </EmptyMedia>

          <EmptyHeader>
            {/* 404 number */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-3 font-mono text-5xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {c.code}
            </motion.p>

            <EmptyTitle className="text-2xl font-bold text-white">
              {c.title}
            </EmptyTitle>

            <EmptyDescription className="mt-3 text-white/50">
              {c.desc}
            </EmptyDescription>
          </EmptyHeader>

          {/* Gradient divider */}
          <div
            className="h-px w-full max-w-[200px]"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(139,92,246,0.3), transparent)',
            }}
          />

          <EmptyContent>
            {/* Primary — home */}
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)',
              }}
            >
              <ArrowRight
                className={`h-4 w-4 ${isRtl ? '' : 'rotate-180'}`}
                strokeWidth={2.5}
              />
              {c.home}
            </Link>

            {/* Secondary — program */}
            <Link
              href="/program"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/8 hover:text-white active:scale-[0.98]"
            >
              {c.program}
            </Link>
          </EmptyContent>

          {/* Footer branding */}
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/20">
            CICT 2026
          </p>
        </Empty>
      </motion.div>
    </div>
  );
}
