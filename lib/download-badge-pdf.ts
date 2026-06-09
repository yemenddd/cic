export async function downloadBadgePDF(name = 'CICT-Badge') {
  const card = document.getElementById('cict-badge-card');
  if (!card) return;

  // Hide action buttons during capture
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.visibility = 'hidden'; });

  try {
    const [{ toPng }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);

    // Capture at high resolution with white background
    const dataUrl = await toPng(card, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      // Skip hidden elements naturally
      filter: node => !(node as HTMLElement).classList?.contains('badge-no-print'),
    });

    // A4 portrait with 20mm margins, card centered
    const A4_W = 210;
    const A4_H = 297;
    const MARGIN = 20;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, A4_W, A4_H, 'F');

    // Fit card width to page with margins, keep aspect ratio
    const img = new Image();
    img.src = dataUrl;
    await new Promise(res => { img.onload = res; });

    const aspect = img.naturalHeight / img.naturalWidth;
    const imgW = A4_W - MARGIN * 2;
    const imgH = imgW * aspect;
    const x = MARGIN;
    const y = Math.max(MARGIN, (A4_H - imgH) / 2);

    pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH);

    const safeName = name.replace(/\s+/g, '-') || 'Badge';
    const fileName = `${safeName}-CICT2026.pdf`;

    // iOS Safari: open in new tab (can't trigger blob download)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      const blob = pdf.output('blob');
      window.open(URL.createObjectURL(blob), '_blank');
    } else {
      pdf.save(fileName);
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Fallback: download as image
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(card, { pixelRatio: 3, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${name.replace(/\s+/g, '-') || 'Badge'}-CICT2026.png`;
      a.click();
    } catch {
      alert('Could not generate PDF. Please try again.');
    }
  } finally {
    hidden.forEach(el => { el.style.visibility = ''; });
  }
}
