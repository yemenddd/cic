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
  qrValue,
}: {
  name: string;
  categoryId: string;
  categoryLabel: string;
  organization?: string;
  track: string;
  code: string;
  date: string;
  location: string;
  /** The signed badge token, computed on the server — see lib/badge-token.ts. */
  qrValue: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownloadPDF = useCallback(() => { void downloadBadgePDF(name); }, [name]);

  // Copies the confirmation code, not the page URL. On the public confirmation
  // screen the URL was worth sharing; here it is /dashboard/badge, which is
  // behind a login and useless to anyone the attendee sends it to. The code is
  // what actually gets asked for at the door and read out over the phone.
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [code]);

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
      qrValue={qrValue}
      lang="ar"
      onDownloadPDF={handleDownloadPDF}
      onCopyLink={handleCopyCode}
      copied={copied}
      copyLabel="نسخ الرمز"
      backHref="/dashboard"
      backLabel="لوحتي"
    />
  );
}
