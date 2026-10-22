import { useState, useEffect, useRef } from 'react';
import { Expense, PaperFormat } from '../types/expense';
import { parseAutoDownloadParams } from '../utils/qrCodeHelper';
import { exportReceiptToImage, exportReceiptToPdf } from '../utils/exportMasterRoll';
import { formatCurrency, formatDate, formatReceiptDate } from '../utils/formatters';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface AutoDownloadHandlerProps {
  activeExpenses: Expense[];
  currencySymbol: string;
}

export default function AutoDownloadHandler({
  activeExpenses,
  currencySymbol,
}: AutoDownloadHandlerProps) {
  const [isTriggered, setIsTriggered] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'downloading' | 'success' | 'error'>('idle');
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'image'>('pdf');
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('thermal');
  const [targetExpenses, setTargetExpenses] = useState<Expense[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if auto_download is requested in URL
    const { isAutoDownload, format, paperFormat: parsedPaper, embeddedExpenses } =
      parseAutoDownloadParams(window.location.search);

    if (isAutoDownload && !isTriggered) {
      setIsTriggered(true);
      setDownloadFormat(format);
      setPaperFormat(parsedPaper);

      // Determine expenses to export: prefer embedded roll payload, fallback to active
      const rollItems =
        embeddedExpenses && embeddedExpenses.length > 0
          ? embeddedExpenses
          : activeExpenses;

      setTargetExpenses(rollItems);
      setStatus('preparing');

      // Allow 300ms for DOM receipt ref to mount with correct styles
      const timer = setTimeout(async () => {
        try {
          setStatus('downloading');
          if (!rollRef.current) {
            throw new Error('Master Roll element not ready.');
          }

          const filename = `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`;

          if (format === 'image') {
            await exportReceiptToImage(rollRef.current, 'png', filename);
          } else {
            await exportReceiptToPdf(rollRef.current, parsedPaper, filename);
          }

          setStatus('success');

          // Clean up the URL query parameters so page refresh does not re-download
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (err: unknown) {
          console.error('Auto download execution error:', err);
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(msg);
          setStatus('error');
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [activeExpenses, isTriggered]);

  const handleManualReDownload = async () => {
    if (!rollRef.current) return;
    try {
      setStatus('downloading');
      const filename = `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`;
      if (downloadFormat === 'image') {
        await exportReceiptToImage(rollRef.current, 'png', filename);
      } else {
        await exportReceiptToPdf(rollRef.current, paperFormat, filename);
      }
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return null;
  }

  // Calculate totals for the auto-download roll
  const sortedExpenses = [...targetExpenses].sort((a, b) => {
    const timeA = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
    const timeB = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
    return timeA - timeB;
  });

  const totalAmount = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTax = sortedExpenses.reduce((sum, e) => sum + (e.tax || 0), 0);
  const totalTip = sortedExpenses.reduce((sum, e) => sum + (e.tip || 0), 0);

  const dateRange = (() => {
    if (sortedExpenses.length === 0) return 'NO TRANSACTIONS';
    const first = formatDate(sortedExpenses[0].date);
    const last = formatDate(sortedExpenses[sortedExpenses.length - 1].date);
    return first === last ? first.toUpperCase() : `${first.toUpperCase()} — ${last.toUpperCase()}`;
  })();

  return (
    <>
      {/* Top Banner Notice for user feedback */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white px-4 py-3 shadow-lg border-b border-stone-700 animate-slide-down font-mono text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {status === 'preparing' || status === 'downloading' ? (
              <span className="animate-spin text-base">⏳</span>
            ) : status === 'success' ? (
              <span className="text-base text-emerald-400">✅</span>
            ) : (
              <span className="text-base text-amber-400">⚠️</span>
            )}

            <div>
              {status === 'preparing' && (
                <span>QR Code Recognized: Preparing Master Roll receipt...</span>
              )}
              {status === 'downloading' && (
                <span>Generating and downloading your {downloadFormat.toUpperCase()} Master Roll...</span>
              )}
              {status === 'success' && (
                <span className="text-emerald-300 font-semibold">
                  Master Roll receipt ({downloadFormat.toUpperCase()}) successfully downloaded!
                </span>
              )}
              {status === 'error' && (
                <span className="text-rose-300">
                  Auto-download notice: {errorMessage || 'Please tap retry to download.'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === 'success' && (
              <button
                type="button"
                onClick={handleManualReDownload}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded text-[11px]"
              >
                Download Again
              </button>
            )}
            {status === 'error' && (
              <button
                type="button"
                onClick={handleManualReDownload}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold"
              >
                Tap to Download Now
              </button>
            )}
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="p-1 text-stone-400 hover:text-white"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Hidden off-screen render container used by html2canvas */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-100"
        aria-hidden="true"
      >
        <div
          ref={rollRef}
          className="relative flex flex-col font-mono shadow-md w-[440px] bg-[#FCFAF7] border border-stone-300 text-stone-800"
          style={{ backgroundColor: '#FCFAF7' }}
        >
          {/* Jagged top */}
          <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-2xs" />

          <div className="px-6 py-8">
            <div className="text-center pb-5 border-b border-stone-300">
              <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold block">
                * TALLYRECEIPT · MASTER AUDIT ROLL *
              </span>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-stone-900 uppercase mt-1">
                Expense Ledger
              </h1>
              <div className="text-xs text-stone-600 font-semibold mt-1.5">
                DATE RANGE: {dateRange}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                TRANSACTION COUNT: {sortedExpenses.length} ENTRIES
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                SCANNED & AUDITED · PHP ₱
              </div>
            </div>

            <div className="receipt-dashed-line my-4" />

            <div className="flex justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider pb-2 border-b border-stone-200">
              <span>Transaction / Description</span>
              <span className="text-right">Amount ({currencySymbol})</span>
            </div>

            <div className="divide-y divide-dashed divide-stone-200 text-xs">
              {sortedExpenses.map((expense, idx) => (
                <div key={expense.id} className="py-3 print-avoid-break">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="font-sans font-bold text-stone-900 text-sm truncate">
                      {String(idx + 1).padStart(2, '0')}. {expense.merchant}
                    </div>
                    <div className="font-mono font-bold text-stone-900 text-sm tabular-nums shrink-0">
                      {formatCurrency(expense.amount, currencySymbol)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                    <span className="font-medium text-stone-700">{formatReceiptDate(expense.date, expense.time)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-stone-800">{expense.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{expense.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-dashed-line my-4" />

            <div className="space-y-1.5 text-xs text-stone-600 print-avoid-break">
              <div className="flex justify-between">
                <span>TOTAL TRANSACTIONS:</span>
                <span className="tabular-nums font-semibold font-mono">{sortedExpenses.length}</span>
              </div>
              {totalTax > 0 && (
                <div className="flex justify-between">
                  <span>ESTIMATED VALUE ADDED TAX (12% VAT):</span>
                  <span className="tabular-nums font-mono">{formatCurrency(totalTax, currencySymbol)}</span>
                </div>
              )}
              {totalTip > 0 && (
                <div className="flex justify-between">
                  <span>SERVICE / TIP:</span>
                  <span className="tabular-nums font-mono">{formatCurrency(totalTip, currencySymbol)}</span>
                </div>
              )}
            </div>

            {/* GRAND TOTAL */}
            <div className="my-5 p-4 bg-stone-900 text-stone-50 rounded-sm print-avoid-break">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-xs tracking-widest text-stone-300 uppercase block font-semibold font-mono">
                    GRAND TOTAL EXPENSES
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    BALANCED & AUDITED · PHP
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono tracking-tight tabular-nums text-white">
                    {formatCurrency(totalAmount, currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-stone-200 print-avoid-break">
              <Barcode value="TALLY-PHP-MASTER-2026" className="scale-95" />
              <div className="text-xs text-stone-700 font-semibold mt-2 uppercase tracking-wider font-mono">
                MARAMING SALAMAT PO
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 tracking-wider font-mono uppercase">
                RETAIN RECEIPT FOR AUDIT & TAX RECORDS
              </div>
              <div className="text-[9px] text-stone-400 mt-2 font-mono">
                *** END OF MASTER REGISTER ROLL ***
              </div>
            </div>
          </div>

          <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-2xs" />
        </div>
      </div>
    </>
  );
}
