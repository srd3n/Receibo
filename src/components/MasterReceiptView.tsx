import { useState, useRef } from 'react';
import { Expense } from '../types/expense';
import { formatCurrency, formatDate, formatReceiptDate } from '../utils/formatters';
import { exportReceiptToImage, exportReceiptToPdf } from '../utils/exportMasterRoll';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface MasterReceiptViewProps {
  expenses: Expense[];
  currencySymbol: string;
  onSelect: (expense: Expense) => void;
  onOpenExportDialog: () => void;
}

export default function MasterReceiptView({
  expenses,
  currencySymbol,
  onSelect,
  onOpenExportDialog,
}: MasterReceiptViewProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const receiptRollRef = useRef<HTMLDivElement>(null);

  // Chronologically sort (oldest first for authentic store roll)
  const sortedExpenses = [...expenses].sort((a, b) => {
    const timeA = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
    const timeB = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
    return timeA - timeB;
  });

  const totalAmount = sortedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTax = sortedExpenses.reduce((sum, e) => sum + (e.tax || 0), 0);
  const totalTip = sortedExpenses.reduce((sum, e) => sum + (e.tip || 0), 0);

  // Date range label
  const dateRange = (() => {
    if (sortedExpenses.length === 0) return 'NO TRANSACTIONS';
    const first = formatDate(sortedExpenses[0].date);
    const last = formatDate(sortedExpenses[sortedExpenses.length - 1].date);
    if (first === last) return first.toUpperCase();
    return `${first.toUpperCase()} — ${last.toUpperCase()}`;
  })();

  const handleQuickPdf = async () => {
    if (!receiptRollRef.current) return;
    try {
      setIsExporting('pdf');
      await exportReceiptToPdf(
        receiptRollRef.current,
        'thermal',
        `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`
      );
    } catch (err: unknown) {
      console.error('Failed to export PDF:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Could not export PDF (${errMsg}).`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleQuickDownload = async () => {
    if (!receiptRollRef.current) return;
    try {
      setIsExporting('image');
      await exportReceiptToImage(
        receiptRollRef.current,
        'png',
        `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`
      );
    } catch (err: unknown) {
      console.error('Failed to download image:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Could not download image (${errMsg}).`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-4 sm:my-6 w-full">
      {/* Action Toolbar Header */}
      <div className="bg-stone-100/90 border border-stone-300 rounded-lg p-3 sm:p-4 mb-4 text-xs font-mono text-stone-700 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold uppercase tracking-wider block text-stone-900">
              Continuous Register Tape Roll
            </span>
            <span className="text-[11px] text-stone-500">
              {sortedExpenses.length} records · {dateRange}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenExportDialog}
              className="px-3.5 py-2 min-h-[40px] bg-stone-900 text-stone-50 font-semibold rounded hover:bg-stone-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>📥</span>
              <span>Download Master Roll</span>
            </button>

            <button
              onClick={handleQuickPdf}
              disabled={isExporting !== null || sortedExpenses.length === 0}
              className="px-3 py-2 min-h-[40px] bg-white border border-stone-300 text-stone-800 font-medium rounded hover:bg-stone-50 transition-colors inline-flex items-center gap-1"
              title="Export as PDF"
            >
              <span>📄</span>
              <span>{isExporting === 'pdf' ? 'Generating...' : 'Export as PDF'}</span>
            </button>

            <button
              onClick={handleQuickDownload}
              disabled={isExporting !== null || sortedExpenses.length === 0}
              className="px-3 py-2 min-h-[40px] bg-white border border-stone-300 text-stone-800 font-medium rounded hover:bg-stone-50 transition-colors inline-flex items-center gap-1"
              title="Download image"
            >
              <span>📥</span>
              <span>{isExporting === 'image' ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Printable/Export Master Roll */}
      <div
        id="printable-master-roll"
        ref={receiptRollRef}
        className="relative flex flex-col font-mono shadow-md w-full bg-[#FCFAF7] border border-stone-300 text-stone-800"
        style={{ backgroundColor: '#FCFAF7' }}
      >
        {/* Jagged top */}
        <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-2xs" />

        <div className="px-5 sm:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="text-center pb-5 border-b border-stone-300">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-semibold block">
              * TALLYRECEIPT · MASTER AUDIT ROLL *
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-stone-900 uppercase mt-1">
              Expense Ledger
            </h2>
            <div className="text-xs text-stone-600 font-semibold mt-1.5">
              DATE RANGE: {dateRange}
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              TRANSACTIONS RECORDED: {sortedExpenses.length} ENTRIES
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              GENERATED: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-[10px] text-stone-400 tracking-wider">
              PHILIPPINE PESO REGISTER · TERMINAL #01
            </div>
          </div>

          <div className="receipt-dashed-line my-4" />

          {/* Column titles */}
          <div className="flex justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider pb-2 border-b border-stone-200">
            <span>Transaction / Description</span>
            <span className="text-right">Amount ({currencySymbol})</span>
          </div>

          {/* List of expenses itemized chronologically */}
          {sortedExpenses.length === 0 ? (
            <div className="py-12 text-center text-stone-400 italic text-xs">
              No transactions recorded in this period.
            </div>
          ) : (
            <div className="divide-y divide-dashed divide-stone-200 text-xs">
              {sortedExpenses.map((expense, idx) => (
                <div
                  key={expense.id}
                  onClick={() => onSelect(expense)}
                  className="py-3 sm:py-3.5 hover:bg-stone-100/70 transition-colors cursor-pointer group px-1 print-avoid-break"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="font-sans font-bold text-stone-900 text-sm group-hover:underline truncate">
                      {String(idx + 1).padStart(2, '0')}. {expense.merchant}
                    </div>
                    <div className="font-mono font-bold text-stone-900 text-sm sm:text-base tabular-nums shrink-0">
                      {formatCurrency(expense.amount, currencySymbol)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1 flex-wrap">
                    <span className="font-medium text-stone-700">{formatReceiptDate(expense.date, expense.time)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-stone-800">{expense.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{expense.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-stone-400 font-mono text-[10px]">{expense.receiptNumber}</span>
                  </div>

                  {/* Individual sub-items if present */}
                  {expense.items && expense.items.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-stone-200 space-y-1 text-[11px] text-stone-600">
                      {expense.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-baseline gap-2">
                          <span className="truncate pr-1">
                            {item.quantity > 1 ? `${item.quantity}× ` : ''}
                            {item.name}
                          </span>
                          <span className="tabular-nums shrink-0 font-mono">
                            {formatCurrency(item.price, currencySymbol)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {expense.notes && (
                    <p className="text-[11px] text-stone-500 italic mt-1 pl-1">
                      "{expense.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="receipt-dashed-line my-4 sm:my-5" />

          {/* Subtotals & Taxes */}
          <div className="space-y-1.5 text-xs text-stone-600 pt-1 print-avoid-break">
            <div className="flex justify-between">
              <span>TOTAL SLIPS COUNT:</span>
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

          {/* GRAND TOTAL EMPHASIS */}
          <div className="my-5 p-4 bg-stone-900 text-stone-50 rounded-sm print-avoid-break">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <span className="text-[11px] sm:text-xs tracking-widest text-stone-300 uppercase block font-semibold font-mono">
                  GRAND TOTAL EXPENSES
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  BALANCED & AUDITED · PHP
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums text-white">
                  {formatCurrency(totalAmount, currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode and audit stamp */}
          <div className="text-center pt-3 sm:pt-4 border-t border-stone-200 print-avoid-break">
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

        {/* Jagged bottom */}
        <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-2xs" />
      </div>
    </div>
  );
}
