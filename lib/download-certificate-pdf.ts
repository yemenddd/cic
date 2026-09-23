// Certificate export — same machinery as `download-badge-pdf.ts` (rasterise the
// DOM node with html-to-image, then drop the image onto a jsPDF page), but with
// its own DOM id and an A4 *landscape* page, since a certificate is wide.
//
// JPEG rather than PNG. A lossless capture of a parchment with two radial
// gradients came out at 18 MB, which is a certificate that Gmail refuses to
// attach and half the job portals refuse to accept — on a document whose
// entire purpose is being sent to somebody. At quality 0.94 and three times
// the pixels, the artefacts are invisible on flat colour and type, and the
// file lands around a tenth of the size.
const JPEG_QUALITY = 0.94;
export async function downloadCertificatePDF(name = 'CIC-Certificate') {
  const card = document.getElementById('cic-certificate');
  if (!card) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const safeName = name.replace(/\s+/g, '-') || 'Certificate';

  // Hide action buttons during capture
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.visibility = 'hidden'; });

  try {
    // Wait for all fonts (including Arabic) to finish loading, otherwise the
    // rasterised text falls back to a system face mid-capture.
    await document.fonts.ready;

    const { toJpeg } = await import('html-to-image');

    // Small delay to ensure Framer Motion animations have settled
    await new Promise(r => setTimeout(r, 80));

    // Capture at high resolution with white background
    const dataUrl = await toJpeg(card, {
      quality: JPEG_QUALITY,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      filter: node => !(node as HTMLElement).classList?.contains('badge-no-print'),
    });

    if (isIOS) {
      // iOS Safari: download as an image via <a download> — works natively on
      // iOS 13+. PDF blob URLs show blank pages there, so an image is the
      // reliable option.
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeName}-CIC2026.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Desktop & Android: wrap in a landscape A4 PDF and download
      const { jsPDF } = await import('jspdf');

      const A4_W = 297; // landscape
      const A4_H = 210;
      const MARGIN = 12;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_W, A4_H, 'F');

      const img = new Image();
      img.src = dataUrl;
      await new Promise(res => { img.onload = res; });

      let imgW = A4_W - MARGIN * 2;
      let imgH = imgW * (img.naturalHeight / img.naturalWidth);

      // Never let a taller-than-expected capture run off the page.
      const maxH = A4_H - MARGIN * 2;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH * (img.naturalWidth / img.naturalHeight);
      }

      const x = (A4_W - imgW) / 2;
      const y = (A4_H - imgH) / 2;

      pdf.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
      pdf.save(`${safeName}-CIC2026.pdf`);
    }
  } catch (err) {
    console.error('Certificate download failed:', err);
    // Left as a native alert deliberately: this is the failure path of the
    // download itself, and it has to be visible even when the page's own
    // rendering is what went wrong. Localized, though — an English string
    // in an Arabic interface reads as a crash, not as a message.
    alert('تعذّر إنشاء ملف الشهادة. حاول مرة أخرى.');
  } finally {
    hidden.forEach(el => { el.style.visibility = ''; });
  }
}
