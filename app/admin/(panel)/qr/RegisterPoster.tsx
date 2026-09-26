'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

/**
 * The download half of the registration poster.
 *
 * The poster itself is rendered on the server — the QR is inline SVG from
 * lib/qr, so it ships as markup and is correct before any script runs. This
 * only captures what is already on screen and wraps it in an A4 page, the same
 * way lib/download-badge-pdf.ts does for a badge: jsPDF has no Arabic font, so
 * drawing the text into the PDF directly would print it as boxes, or reversed.
 */
export default function RegisterPoster({ targetId }: { targetId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    const poster = document.getElementById(targetId);
    if (!poster) return;

    setBusy(true);
    setError('');
    try {
      // Arabic type is a web font; capturing before it loads prints the
      // fallback, which is a different poster than the one on screen.
      await document.fonts.ready;

      // Measured, not assumed: passed explicitly below so the clone cannot
      // lay itself out at some other width than the one on screen.
      const rect = poster.getBoundingClientRect();

      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(poster, {
        quality: 1,
        // A QR is read by a camera from a wall. Three times the CSS pixels
        // keeps the module edges hard at A4.
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        width: rect.width,
        height: rect.height,
        style: { margin: '0', maxWidth: 'none' },
      });

      const { jsPDF } = await import('jspdf');
      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 14;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_W, A4_H, 'F');

      const img = new Image();
      img.src = dataUrl;
      await new Promise((done) => { img.onload = done; });

      // Fit inside the margins on whichever side runs out first, and centre.
      const maxW = A4_W - MARGIN * 2;
      const maxH = A4_H - MARGIN * 2;
      const ratio = img.naturalHeight / img.naturalWidth;
      let w = maxW;
      let h = w * ratio;
      if (h > maxH) { h = maxH; w = h / ratio; }

      pdf.addImage(dataUrl, 'PNG', (A4_W - w) / 2, (A4_H - h) / 2, w, h);
      pdf.save('CIC-register-qr.pdf');
    } catch {
      setError('تعذّر إنشاء الملف. حدّث الصفحة وحاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60"
        style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'جارٍ التجهيز…' : 'تنزيل الملصق PDF'}
      </button>

      {error && (
        <p className="mt-2 text-[12.5px]" style={{ color: '#f87171' }}>{error}</p>
      )}
    </div>
  );
}
