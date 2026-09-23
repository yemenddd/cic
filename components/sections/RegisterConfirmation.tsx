'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState, useCallback } from 'react';
import ConferenceBadge from '@/components/ui/ConferenceBadge';
import { downloadBadgePDF } from '@/lib/download-badge-pdf';

function ConfirmationContent() {
  const params = useSearchParams();
  const name      = params.get('n')    ?? '';
  const catId     = params.get('c')    ?? 'visitor';
  const catLabel  = params.get('cl')   ?? '';
  const track     = params.get('t')    ?? '';
  const code      = params.get('k')    ?? '';
  const org       = params.get('org')  ?? '';
  // The signed token the door scanner reads. Present on links produced after
  // this change; older ones fall back to the printed code alone, which is what
  // the desk has always been able to work from.
  const qrValue   = params.get('q')    ?? '';
  const lang      = (params.get('lang') ?? 'ar') as 'ar' | 'en' | 'tr';

  const date     = lang === 'ar' ? '2-3 أكتوبر 2026' : lang === 'tr' ? '2-3 Ekim 2026' : 'Oct 2–3, 2026';
  const location = lang === 'ar' ? 'إسطنبول - تركيا'  : lang === 'tr' ? 'İstanbul, Türkiye'   : 'Istanbul, Turkey';

  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = useCallback(() => downloadBadgePDF(name), [name]);
  const handleCopyLink    = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#030712] px-4 py-16">
      <ConferenceBadge
        name={name}
        categoryId={catId}
        categoryLabel={catLabel}
        organization={org}
        track={track}
        code={code}
        date={date}
        location={location}
        qrValue={qrValue || undefined}
        lang={lang}
        onDownloadPDF={handleDownloadPDF}
        onCopyLink={handleCopyLink}
        copied={copied}
      />

      {/* Whoever opens this link is holding a pass and, unless somebody else
          sent it to them, an account they may not know exists. The badge alone
          never said so. */}
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <p className="text-[14px] font-bold text-white">
          {lang === 'ar'
            ? 'لديك حساب في منصة المؤتمر'
            : lang === 'tr'
              ? 'Konferans platformunda bir hesabınız var'
              : 'You have an account on the conference platform'}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/70">
          {lang === 'ar'
            ? 'من حسابك تتابع بطاقتك وجدولك وشهادتك، وتستعيد البطاقة في أي وقت إن فقدتها.'
            : lang === 'tr'
              ? 'Hesabınızdan kartınızı, programınızı ve sertifikanızı takip edebilir, kartınızı istediğiniz zaman yeniden alabilirsiniz.'
              : 'Your account holds your badge, your schedule and your certificate — and can reissue the badge any time.'}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-[13.5px] font-semibold text-[#030712]"
        >
          {lang === 'ar' ? 'الدخول إلى حسابي' : lang === 'tr' ? 'Hesabıma giriş' : 'Sign in to my account'}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterConfirmation() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
