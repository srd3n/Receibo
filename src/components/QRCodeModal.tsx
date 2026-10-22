import { useState, useEffect } from 'react';
import { Expense, PaperFormat } from '../types/expense';
import { encodeRollToUrl, generateQrDataUrl } from '../utils/qrCodeHelper';
import { formatCurrency } from '../utils/formatters';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  currencySymbol: string;
  onOpenScanner: () => void;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  expenses,
  currencySymbol,
  onOpenScanner,
}: QRCodeModalProps) {
  const [format, setFormat] = useState<'pdf' | 'image'>('pdf');
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('thermal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Generate QR code whenever expenses, format, or paperFormat change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    const targetUrl = encodeRollToUrl(expenses, format, paperFormat);
    setQrTargetUrl(targetUrl);

    generateQrDataUrl(targetUrl)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, expenses, format, paperFormat]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrTargetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = qrTargetUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `tallyreceipt-qr-download-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-lg bg-[#FCFAF7] border border-stone-300 rounded-lg shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col font-mono text-stone-800">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300 bg-stone-100/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📱</span>
              <h2 id="qr-modal-title" className="font-sans font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                Scan to Download Master Roll
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Scan with any mobile camera for instantaneous download
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm p-1"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Format selection */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`py-2 px-3 border rounded text-center transition-all min-h-[40px] flex items-center justify-center gap-2 ${
                format === 'pdf'
                  ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-2xs'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>📄</span>
              <span>Auto-Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('image')}
              className={`py-2 px-3 border rounded text-center transition-all min-h-[40px] flex items-center justify-center gap-2 ${
                format === 'image'
                  ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-2xs'
                  : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span>🖼️</span>
              <span>Auto-Download Image</span>
            </button>
          </div>

          {/* Paper layout if PDF */}
          {format === 'pdf' && (
            <div>
              <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Target PDF Layout:
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPaperFormat('thermal')}
                  className={`py-1.5 px-2 rounded border text-center ${
                    paperFormat === 'thermal'
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  80mm Roll
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`py-1.5 px-2 rounded border text-center ${
                    paperFormat === 'a4'
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  A4 Page
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('letter')}
                  className={`py-1.5 px-2 rounded border text-center ${
                    paperFormat === 'letter'
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>
          )}

          {/* QR Code Thermal Stamp Display */}
          <div className="flex flex-col items-center justify-center p-4 bg-white border border-stone-300 rounded shadow-xs relative">
            {isGenerating ? (
              <div className="h-56 w-56 flex flex-col items-center justify-center text-xs text-stone-400 gap-2">
                <span className="animate-spin text-xl">⏳</span>
                <span>Generating QR stamp...</span>
              </div>
            ) : qrDataUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-2 bg-[#FCFAF7] border-2 border-stone-900 rounded-sm shadow-inner">
                  <img
                    src={qrDataUrl}
                    alt="Master Roll Download QR Code"
                    className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                  />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-[11px] font-bold text-stone-900 uppercase tracking-widest">
                    * AUTO-DOWNLOAD STAMP · ₱ *
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {expenses.length} SLIPS · {formatCurrency(totalAmount, currencySymbol)} · {format.toUpperCase()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-red-500">
                Failed to render QR Code.
              </div>
            )}
          </div>

          {/* Instructions Box */}
          <div className="p-3 bg-stone-100/80 rounded border border-stone-200 text-xs space-y-1">
            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
              <span>💡</span>
              <span>How it works:</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Open your iPhone or Android camera, point it at this QR code, and tap the link that appears. The phone will instantly open the master roll and trigger the {format.toUpperCase()} download without requiring login!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2.5 min-h-[44px] text-xs font-semibold bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{copied ? '✓' : '🔗'}</span>
                <span>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQrImage}
                className="px-3 py-2.5 min-h-[44px] text-xs font-semibold bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>📥</span>
                <span>Save QR Image</span>
              </button>
            </div>

            {/* In-app camera scanner button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="w-full px-4 py-2.5 min-h-[44px] text-xs font-bold text-stone-900 bg-stone-200 hover:bg-stone-300 border border-stone-300 rounded transition-colors flex items-center justify-center gap-2"
            >
              <span>📷</span>
              <span>Scan QR Code Using This Device's Camera</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-100/90 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
