export async function downloadBadgePDF(name = 'CICT-Badge') {
  const card = document.getElementById('cict-badge-card');
  if (!card) return;

  // Hide action buttons
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.display = 'none'; });

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    // Use device pixel ratio for crisp rendering on high-DPI mobile screens
    const scale = Math.min(window.devicePixelRatio * 2, 4);

    const canvas = await html2canvas(card, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: card.offsetWidth,
      height: card.offsetHeight,
      onclone: (_, el) => {
        el.style.background = '#ffffff';
        el.style.boxShadow = 'none';
      },
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 portrait, 20mm margins, card centered
    const A4_W = 210;
    const A4_H = 297;
    const MARGIN = 20;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, A4_W, A4_H, 'F');

    const maxW = A4_W - MARGIN * 2;
    const aspect = canvas.height / canvas.width;
    const imgW = maxW;
    const imgH = imgW * aspect;
    const x = MARGIN;
    const y = Math.max(MARGIN, (A4_H - imgH) / 2);

    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);

    const safeName = name.replace(/\s+/g, '-');
    const fileName = `${safeName}-CICT2026.pdf`;

    // iOS Safari cannot trigger blob downloads — open PDF in new tab instead
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      pdf.save(fileName);
    }
  } finally {
    hidden.forEach(el => { el.style.display = ''; });
  }
}
