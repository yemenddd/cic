'use client';

import { useCallback, useState } from 'react';
import ConferenceBadge from '@/components/ui/ConferenceBadge';
import { downloadBadgePDF } from '@/lib/download-badge-pdf';

// Thin client wrapper: ConferenceBadge needs the download/copy callbacks and
// the `copied` flag, so the page around it can stay a Server Component.
export default function DashboardBadge({
  name,
  categoryId,
  categoryLabel,
  organization,
  track,
  code,
  date,
  location,
}: {
  name: string;
  categoryId: string;
  categoryLabel: string;
  organization?: string;
  track: string;
  code: string;
  date: string;
  location: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = useCallback(() => { void downloadBadgePDF(name); }, [name]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, []);

  return (
    <ConferenceBadge
      name={name}
      categoryId={categoryId}
      categoryLabel={categoryLabel}
      organization={organization}
      track={track}
      code={code}
      date={date}
      location={location}
      lang="ar"
      onDownloadPDF={handleDownloadPDF}
      onCopyLink={handleCopyLink}
      copied={copied}
    />
  );
}
