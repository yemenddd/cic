'use client';

import { useSearchParams } from 'next/navigation';
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
  const lang      = (params.get('lang') ?? 'ar') as 'ar' | 'en' | 'tr';

  const date     = lang === 'ar' ? '15-16 أغسطس 2026' : lang === 'tr' ? '15-16 Ağustos 2026' : 'Aug 15–16, 2026';
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
    <div className="flex min-h-screen items-center justify-center bg-[#030712] px-4 py-16">
      <ConferenceBadge
        name={name}
        categoryId={catId}
        categoryLabel={catLabel}
        organization={org}
        track={track}
        code={code}
        date={date}
        location={location}
        lang={lang}
        onDownloadPDF={handleDownloadPDF}
        onCopyLink={handleCopyLink}
        copied={copied}
      />
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
