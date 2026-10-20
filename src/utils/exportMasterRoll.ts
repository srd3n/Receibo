import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { PaperFormat } from '../types/expense';

export async function exportReceiptToImage(
  element: HTMLElement,
  format: 'png' | 'jpeg' = 'png',
  filename: string = 'master-receipt'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2, // 2x retina sharpness
    useCORS: true,
    backgroundColor: '#FCFAF7',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  const link = document.createElement('a');
  link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportReceiptToPdf(
  element: HTMLElement,
  paperFormat: PaperFormat = 'thermal',
  filename: string = 'master-receipt'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#FCFAF7',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');

  if (paperFormat === 'thermal') {
    // Continuous 80mm roll width
    const pdfWidth = 80; // mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, Math.max(pdfHeight, 100)],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`${filename}-thermal.pdf`);
  } else {
    // Standard A4 or US Letter page format
    const isA4 = paperFormat === 'a4';
    const pageWidth = isA4 ? 210 : 215.9; // mm
    const pageHeight = isA4 ? 297 : 279.4; // mm
    const margin = 15; // mm margins left/right
    const contentWidth = pageWidth - margin * 2;
    const totalHeight = (canvas.height * contentWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isA4 ? 'a4' : 'letter',
    });

    const printableHeight = pageHeight - margin * 2;
    let heightLeft = totalHeight;
    let position = margin;
    let pageNum = 1;

    // First page
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      position,
      contentWidth,
      totalHeight,
      undefined,
      'FAST'
    );
    heightLeft -= printableHeight;

    // Subsequent pages if receipt is longer than one page
    while (heightLeft > 0) {
      pdf.addPage();
      pageNum += 1;
      position = margin - (pageNum - 1) * printableHeight;
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        contentWidth,
        totalHeight,
        undefined,
        'FAST'
      );
      heightLeft -= printableHeight;
    }

    pdf.save(`${filename}-${paperFormat}.pdf`);
  }
}
