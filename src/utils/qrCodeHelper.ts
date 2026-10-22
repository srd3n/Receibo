import QRCode from 'qrcode';
import { Expense, PaperFormat } from '../types/expense';

export interface AutoDownloadConfig {
  format: 'pdf' | 'image';
  paperFormat: PaperFormat;
}

/**
 * Encodes roll payload so that scanning the QR code on any device
 * (even another phone without local storage) can reconstruct the Master Roll.
 */
export function encodeRollToUrl(
  expenses: Expense[],
  format: 'pdf' | 'image' = 'pdf',
  paperFormat: PaperFormat = 'thermal'
): string {
  const baseUrl = window.location.origin + window.location.pathname;

  // Compact payload: id, merchant, date, amount, category, paymentMethod, receiptNumber
  const minimalData = expenses.slice(0, 40).map((e) => ({
    i: e.id,
    m: e.merchant,
    d: e.date,
    a: e.amount,
    c: e.category,
    p: e.paymentMethod,
    r: e.receiptNumber,
    n: e.notes ? e.notes.slice(0, 40) : undefined,
  }));

  try {
    const jsonStr = JSON.stringify(minimalData);
    // Base64 encode for safe URL usage
    const b64 = btoa(encodeURIComponent(jsonStr));
    // Standard QR code handles up to ~2300 chars in medium ECC mode
    if (b64.length < 1800) {
      return `${baseUrl}?auto_download=true&format=${format}&paper=${paperFormat}&roll=${b64}`;
    }
  } catch (err) {
    console.warn('Could not compress roll payload for URL:', err);
  }

  // Fallback to auto-download parameter for current device/session
  return `${baseUrl}?auto_download=true&format=${format}&paper=${paperFormat}`;
}

/**
 * Decodes roll data from URL if present
 */
export function decodeRollFromUrl(encodedStr: string): Expense[] | null {
  try {
    const jsonStr = decodeURIComponent(atob(encodedStr));
    const items = JSON.parse(jsonStr);
    if (Array.isArray(items)) {
      return items.map((item, idx) => ({
        id: item.i || `scanned-${idx}-${Date.now()}`,
        merchant: item.m || 'General Expense',
        date: item.d || new Date().toISOString().slice(0, 10),
        time: '12:00',
        amount: Number(item.a) || 0,
        category: item.c || 'Other Expenses',
        paymentMethod: item.p || 'Cash',
        receiptNumber: item.r || `RCP-${10000 + idx}`,
        currency: '₱',
        notes: item.n || undefined,
      }));
    }
  } catch (err) {
    console.error('Failed to decode roll from URL:', err);
  }
  return null;
}

/**
 * Parses auto download parameters from the window location search
 */
export function parseAutoDownloadParams(search: string): {
  isAutoDownload: boolean;
  format: 'pdf' | 'image';
  paperFormat: PaperFormat;
  embeddedExpenses: Expense[] | null;
} {
  const params = new URLSearchParams(search);
  const isAutoDownload = params.get('auto_download') === 'true';
  const format = params.get('format') === 'image' ? 'image' : 'pdf';
  const rawPaper = params.get('paper');
  const paperFormat: PaperFormat =
    rawPaper === 'a4' || rawPaper === 'letter' ? rawPaper : 'thermal';

  const rollB64 = params.get('roll');
  const embeddedExpenses = rollB64 ? decodeRollFromUrl(rollB64) : null;

  return {
    isAutoDownload,
    format,
    paperFormat,
    embeddedExpenses,
  };
}

/**
 * Generates high-res QR code as a Data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 360,
    margin: 2,
    color: {
      dark: '#1C1917', // dark charcoal to match receipt ink
      light: '#FCFAF7', // receipt paper cream color
    },
    errorCorrectionLevel: 'M',
  });
}
