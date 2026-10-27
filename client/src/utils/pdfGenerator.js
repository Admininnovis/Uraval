import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a tax invoice DOM element directly as standard A4 PDF.
 */
export async function downloadInvoiceElementPdf(elementId, invoiceNumber = 'invoice') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Invoice element #${elementId} not found`);
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
