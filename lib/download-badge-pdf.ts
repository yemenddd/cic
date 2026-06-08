export async function downloadBadgePDF(name = 'CICT-Badge') {
  const card = document.getElementById('cict-badge-card');
  if (!card) return;

  // Temporarily hide buttons so they don't appear in the PDF
  const hidden = Array.from(card.querySelectorAll<HTMLElement>('.badge-no-print'));
  hidden.forEach(el => { el.style.display = 'none'; });

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(card, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');

    // Size the PDF exactly to the card dimensions
    const pxToMm = 25.4 / 96; // 96 DPI
    const pdfW = card.offsetWidth  * pxToMm;
    const pdfH = card.offsetHeight * pxToMm;

    const pdf = new jsPDF({
      orientation: pdfW > pdfH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfW, pdfH],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`${name.replace(/\s+/g, '-')}-CICT2026.pdf`);
  } finally {
    hidden.forEach(el => { el.style.display = ''; });
  }
}
