export async function downloadBadgePDF(name = 'CICT-Badge') {
  const card = document.getElementById('cict-badge-card');
  if (!card) return;

  // Hide action buttons so they don't appear in the PDF
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.display = 'none'; });

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(card, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Force white background on the element itself
      onclone: (_, el) => {
        el.style.background = '#ffffff';
        el.style.boxShadow = 'none';
      },
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 portrait — always, regardless of device
    const A4_W = 210;
    const A4_H = 297;
    const MARGIN = 20; // mm on each side

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // White page background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, A4_W, A4_H, 'F');

    // Scale card to fit within margins, preserving aspect ratio
    const maxW = A4_W - MARGIN * 2;
    const aspect = canvas.height / canvas.width;
    const imgW = maxW;
    const imgH = imgW * aspect;

    // Center vertically on the A4 page
    const x = MARGIN;
    const y = Math.max(MARGIN, (A4_H - imgH) / 2);

    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
    pdf.save(`${name.replace(/\s+/g, '-')}-CICT2026.pdf`);
  } finally {
    hidden.forEach(el => { el.style.display = ''; });
  }
}
