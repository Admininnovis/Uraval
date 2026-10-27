import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a single invoice element as a crisp, standardized A4 PDF.
 */
export async function downloadInvoiceElementPdf(elementId, invoiceNumber = 'invoice') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found for PDF export`);
  }

  // Ensure all images are loaded before rendering
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFFFF',
    logging: false,
    width: 794,
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(`Invoice-${invoiceNumber}.pdf`);
}

/**
 * Downloads multiple invoice elements concatenated into a single multi-page PDF.
 */
export async function downloadMultipleInvoiceElementsPdf(elementIds, filename = 'Uravuu-Invoices.pdf') {
  if (!elementIds || elementIds.length === 0) {
    throw new Error('No invoice elements provided to generate batch PDF');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < elementIds.length; i++) {
    const el = document.getElementById(elementIds[i]);
    if (!el) continue;

    const images = el.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 794,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  }

  pdf.save(filename);
}
