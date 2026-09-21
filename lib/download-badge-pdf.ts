export async function downloadBadgePDF(name = 'CIC-Badge') {
  const card = document.getElementById('cic-badge-card');
  if (!card) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const safeName = name.replace(/\s+/g, '-') || 'Badge';

  // Hide action buttons during capture
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.visibility = 'hidden'; });

  try {
    // Wait for all fonts (including Arabic) to finish loading
    await document.fonts.ready;

    const { toPng } = await import('html-to-image');

    // Small delay to ensure Framer Motion animations have settled
    await new Promise(r => setTimeout(r, 80));

    // Capture at high resolution with white background
    const dataUrl = await toPng(card, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      filter: node => !(node as HTMLElement).classList?.contains('badge-no-print'),
    });

    if (isIOS) {
      // iOS Safari: download as PNG via <a download> — works natively on iOS 13+
      // PDF blob URLs show blank pages on iOS Safari, PNG is the reliable option
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeName}-CIC2026.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Desktop & Android: wrap in A4 PDF and download
      const { jsPDF } = await import('jspdf');

      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 20;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_W, A4_H, 'F');

      const img = new Image();
      img.src = dataUrl;
      await new Promise(res => { img.onload = res; });

      const imgW = A4_W - MARGIN * 2;
      const imgH = imgW * (img.naturalHeight / img.naturalWidth);
      const y = Math.max(MARGIN, (A4_H - imgH) / 2);

      pdf.addImage(dataUrl, 'PNG', MARGIN, y, imgW, imgH);
      pdf.save(`${safeName}-CIC2026.pdf`);
    }
  } catch (err) {
    console.error('Badge download failed:', err);
    // Left as a native alert deliberately: this is the failure path of the
    // download itself, and it has to be visible even when the page's own
    // rendering is what went wrong. Localized, though — an English string
    // in an Arabic interface reads as a crash, not as a message.
    alert('تعذّر إنشاء ملف البطاقة. حاول مرة أخرى.');
  } finally {
    hidden.forEach(el => { el.style.visibility = ''; });
  }
}
