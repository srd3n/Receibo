import { useState, useRef, useMemo } from 'react';
import { Expense, PaperFormat } from '../types/expense';
import { CATEGORIES, formatCurrency, formatDate, formatReceiptDate } from '../utils/formatters';
import { exportReceiptToImage, exportReceiptToPdf } from '../utils/exportMasterRoll';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface PrintMasterRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  currencySymbol: string;
}

export default function PrintMasterRollModal({
  isOpen,
  onClose,
  expenses,
  currencySymbol,
}: PrintMasterRollModalProps) {
  // Filters for the Master Roll
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'this_month' | 'last_30' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [chronologicalOrder, setChronologicalOrder] = useState<'asc' | 'desc'>('asc'); // asc = chronological (oldest to newest)
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('thermal');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Filter & sort transactions for this master roll
  const rollExpenses = useMemo(() => {
    let list = [...expenses];

    // Category filter
    if (selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    // Date range filter
    const now = new Date();
    if (dateFilterPreset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      list = list.filter((e) => e.date.startsWith(prefix));
    } else if (dateFilterPreset === 'last_30') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pastStr = past30.toISOString().slice(0, 10);
      list = list.filter((e) => e.date >= pastStr);
    } else if (dateFilterPreset === 'custom') {
      if (startDate) {
        list = list.filter((e) => e.date >= startDate);
      }
      if (endDate) {
        list = list.filter((e) => e.date <= endDate);
      }
    }

    // Sort: asc = oldest to newest (chronological store roll), desc = newest first
    list.sort((a, b) => {
      const timeA = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
      const timeB = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
      return chronologicalOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return list;
  }, [expenses, selectedCategory, dateFilterPreset, startDate, endDate, chronologicalOrder]);

  // Calculations
  const totalAmount = useMemo(() => rollExpenses.reduce((sum, e) => sum + e.amount, 0), [rollExpenses]);
  const totalTax = useMemo(() => rollExpenses.reduce((sum, e) => sum + (e.tax || 0), 0), [rollExpenses]);
  const totalTip = useMemo(() => rollExpenses.reduce((sum, e) => sum + (e.tip || 0), 0), [rollExpenses]);

  // Date range label for header
  const dateRangeLabel = useMemo(() => {
    if (rollExpenses.length === 0) return 'NO TRANSACTIONS';
    const dates = rollExpenses.map((e) => e.date).sort();
    const first = formatDate(dates[0]);
    const last = formatDate(dates[dates.length - 1]);
    if (first === last) return first.toUpperCase();
    return `${first.toUpperCase()} — ${last.toUpperCase()}`;
  }, [rollExpenses]);

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting('pdf');
      const filename = `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`;
      await exportReceiptToPdf(receiptRef.current, paperFormat, filename);
    } catch (err: unknown) {
      console.error('PDF export failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`PDF export error: ${errMsg}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting('download');
      const filename = `tallyreceipt-master-roll-${new Date().toISOString().slice(0, 10)}`;
      await exportReceiptToImage(receiptRef.current, 'png', filename);
    } catch (err: unknown) {
      console.error('Download failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Download error: ${errMsg}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="master-roll-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div className="relative w-full max-w-5xl bg-white border border-stone-300 rounded-lg shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <h2 id="master-roll-title" className="text-base sm:text-lg font-bold text-stone-900 font-sans flex items-center gap-2">
              <span>Download Master Roll</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-600 bg-stone-200/90 px-2 py-0.5 rounded">
                Thermal Register Tape
              </span>
            </h2>
            <p className="text-xs text-stone-500 font-mono">
              Consolidated single-store receipt export matching app design
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-mono p-1"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content Layout: Left Options & Filters, Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Controls Column */}
          <div className="p-4 sm:p-6 space-y-5 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-stone-200 bg-stone-50/50">
            {/* Select Export Action: Retain export as pdf and download only */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2 font-mono">
                1. Select Export Action
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting !== null || rollExpenses.length === 0}
                  className="px-3.5 py-3 min-h-[44px] text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 rounded transition-colors shadow-2xs flex items-center justify-center gap-2 font-mono"
                >
                  <span>📄</span>
                  <span>{isExporting === 'pdf' ? 'Generating...' : 'Export as PDF'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isExporting !== null || rollExpenses.length === 0}
                  className="px-3.5 py-3 min-h-[44px] text-xs font-semibold text-stone-900 bg-white border border-stone-300 hover:bg-stone-100 disabled:bg-stone-100 rounded transition-colors shadow-2xs flex items-center justify-center gap-2 font-mono"
                >
                  <span>📥</span>
                  <span>{isExporting === 'download' ? 'Downloading...' : 'Download'}</span>
                </button>
              </div>
            </div>

            {/* Paper Size / Layout Format */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 font-mono">
                2. Layout & Paper Geometry
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPaperFormat('thermal')}
                  className={`py-2 px-2 border rounded text-center transition-colors min-h-[44px] flex flex-col justify-center items-center ${
                    paperFormat === 'thermal'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-2xs'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>Thermal Roll</span>
                  <span className="text-[10px] opacity-80">80mm tape</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`py-2 px-2 border rounded text-center transition-colors min-h-[44px] flex flex-col justify-center items-center ${
                    paperFormat === 'a4'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-2xs'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>A4 Standard</span>
                  <span className="text-[10px] opacity-80">210 × 297mm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('letter')}
                  className={`py-2 px-2 border rounded text-center transition-colors min-h-[44px] flex flex-col justify-center items-center ${
                    paperFormat === 'letter'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-2xs'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>US Letter</span>
                  <span className="text-[10px] opacity-80">8.5 × 11 in</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 font-mono">
                {paperFormat === 'thermal'
                  ? 'Continuous single-page register roll with authentic 80mm cash wrap width.'
                  : 'Multi-page document formatting cleanly paginating without clipping lines.'}
              </p>
            </div>

            {/* Date Range Filtering */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 font-mono">
                3. Date Range Filter
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDateFilterPreset('all')}
                  className={`py-1.5 px-2 rounded border text-center font-medium min-h-[38px] ${
                    dateFilterPreset === 'all'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  All Records
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterPreset('this_month')}
                  className={`py-1.5 px-2 rounded border text-center font-medium min-h-[38px] ${
                    dateFilterPreset === 'this_month'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterPreset('last_30')}
                  className={`py-1.5 px-2 rounded border text-center font-medium min-h-[38px] ${
                    dateFilterPreset === 'last_30'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterPreset('custom')}
                  className={`py-1.5 px-2 rounded border text-center font-medium min-h-[38px] ${
                    dateFilterPreset === 'custom'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  Custom
                </button>
              </div>

              {dateFilterPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-500 font-mono block">From Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded bg-white font-mono min-h-[38px]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-mono block">To Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded bg-white font-mono min-h-[38px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 font-mono">
                4. Expense Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded bg-white text-stone-900 min-h-[44px] font-mono"
              >
                <option value="All">All Categories ({expenses.length} slips)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chronological Sort Toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5 font-mono">
                5. Transaction Sequence
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setChronologicalOrder('asc')}
                  className={`py-2 px-2 border rounded text-center transition-colors min-h-[40px] flex items-center justify-center gap-1.5 ${
                    chronologicalOrder === 'asc'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>↑ Chronological</span>
                  <span className="text-[10px] opacity-75">(Oldest 1st)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChronologicalOrder('desc')}
                  className={`py-2 px-2 border rounded text-center transition-colors min-h-[40px] flex items-center justify-center gap-1.5 ${
                    chronologicalOrder === 'desc'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold'
                      : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>↓ Reverse</span>
                  <span className="text-[10px] opacity-75">(Newest 1st)</span>
                </button>
              </div>
            </div>

            {/* Roll Summary Box */}
            <div className="p-3 bg-stone-200/60 rounded border border-stone-300 text-xs font-mono space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Selected Entries:</span>
                <span className="font-bold text-stone-900">{rollExpenses.length} transactions</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total Amount:</span>
                <span className="font-bold text-stone-900">{formatCurrency(totalAmount, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[11px] pt-1 border-t border-stone-300">
                <span>Export Style:</span>
                <span>Authentic Paper Receipt</span>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="p-4 sm:p-6 bg-stone-200/50 lg:col-span-7 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full flex items-center justify-between mb-3 text-xs font-mono text-stone-600">
              <span className="font-semibold uppercase tracking-wider">
                Live Master Roll Preview
              </span>
              <span>{rollExpenses.length} Slips Loaded</span>
            </div>

            {/* Container for receipt */}
            <div
              className={`transition-all duration-200 w-full ${
                paperFormat === 'thermal'
                  ? 'max-w-md'
                  : paperFormat === 'a4'
                  ? 'max-w-xl'
                  : 'max-w-lg'
              }`}
            >
              {/* THE MASTER ROLL RECEIPT TO EXPORT */}
              <div
                id="printable-master-roll"
                ref={receiptRef}
                className="relative flex flex-col font-mono shadow-xl bg-[#FCFAF7] border border-stone-300 text-stone-800"
                style={{ backgroundColor: '#FCFAF7' }}
              >
                {/* Jagged top cut */}
                <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-2xs" />

                <div className="px-5 sm:px-8 py-6 sm:py-8">
                  {/* Master Store Header */}
                  <div className="text-center pb-5 border-b border-stone-300">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-semibold block">
                      * TALLYRECEIPT · MASTER AUDIT ROLL *
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-stone-900 uppercase mt-1">
                      Expense Ledger
                    </h1>
                    <div className="text-xs text-stone-600 font-semibold mt-1.5">
                      DATE RANGE: {dateRangeLabel}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      TRANSACTION COUNT: {rollExpenses.length} ENTRIES
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      EXPORTED: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-stone-400 tracking-wider">
                      TERMINAL #01 · AUTH CODE PHP-ROLL-MASTER
                    </div>
                  </div>

                  <div className="receipt-dashed-line my-4" />

                  {/* Receipt Column Headings */}
                  <div className="flex justify-between text-xs text-stone-500 font-semibold uppercase tracking-wider pb-2 border-b border-stone-200">
                    <span>Transaction / Description</span>
                    <span className="text-right">Amount ({currencySymbol})</span>
                  </div>

                  {/* Chronological List of Transactions */}
                  {rollExpenses.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 italic text-xs">
                      No transactions matched the selected date or category filters.
                    </div>
                  ) : (
                    <div className="divide-y divide-dashed divide-stone-200 text-xs">
                      {rollExpenses.map((expense, idx) => (
                        <div
                          key={expense.id}
                          className="py-3 print-avoid-break"
                        >
                          {/* Row 1: Number, Merchant, and Emphasized Amount */}
                          <div className="flex justify-between items-baseline gap-2">
                            <div className="font-sans font-bold text-stone-900 text-sm truncate">
                              {String(idx + 1).padStart(2, '0')}. {expense.merchant}
                            </div>
                            <div className="font-mono font-bold text-stone-900 text-sm sm:text-base tabular-nums shrink-0">
                              {formatCurrency(expense.amount, currencySymbol)}
                            </div>
                          </div>

                          {/* Row 2: Metadata */}
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                            <span className="font-medium text-stone-700">{formatReceiptDate(expense.date, expense.time)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-stone-800">{expense.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{expense.paymentMethod}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-stone-400 font-mono text-[10px]">{expense.receiptNumber}</span>
                          </div>

                          {/* Row 3: Line Items if present */}
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

                          {/* Notes if present */}
                          {expense.notes && (
                            <p className="text-[11px] text-stone-500 italic mt-1 pl-1">
                              "{expense.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="receipt-dashed-line my-4" />

                  {/* Calculations & Subtotals */}
                  <div className="space-y-1.5 text-xs text-stone-600 print-avoid-break">
                    <div className="flex justify-between">
                      <span>TOTAL TRANSACTIONS / SLIPS:</span>
                      <span className="tabular-nums font-semibold font-mono">{rollExpenses.length}</span>
                    </div>
                    {totalTax > 0 && (
                      <div className="flex justify-between">
                        <span>ESTIMATED VALUE ADDED TAX (12% VAT):</span>
                        <span className="tabular-nums font-mono">{formatCurrency(totalTax, currencySymbol)}</span>
                      </div>
                    )}
                    {totalTip > 0 && (
                      <div className="flex justify-between">
                        <span>SERVICE / GRATUITY / TIP:</span>
                        <span className="tabular-nums font-mono">{formatCurrency(totalTip, currencySymbol)}</span>
                      </div>
                    )}
                  </div>

                  {/* GRAND TOTAL SECTION - EMPHASIZED BOLD TYPOGRAPHY */}
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

                  {/* Closing Message and Barcode */}
                  <div className="text-center pt-3 border-t border-stone-200 print-avoid-break">
                    <Barcode value="TALLY-PHP-MASTER-2026" className="scale-95" />
                    <div className="text-xs text-stone-700 font-semibold mt-2 uppercase tracking-wider font-mono">
                      MARAMING SALAMAT PO
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5 tracking-wider font-mono uppercase">
                      RETAIN RECEIPT FOR TAX AND AUDIT RECORDS
                    </div>
                    <div className="text-[9px] text-stone-400 mt-2 font-mono">
                      *** END OF MASTER REGISTER ROLL ***
                    </div>
                  </div>
                </div>

                {/* Jagged bottom cut */}
                <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-2xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 font-mono hidden sm:block">
            High-resolution receipt export preserving colors, fonts, and borders
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors flex-1 sm:flex-initial"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={rollExpenses.length === 0 || isExporting !== null}
              className="px-5 py-2 min-h-[44px] text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 rounded transition-colors shadow-xs flex-1 sm:flex-initial flex items-center justify-center gap-1.5 font-mono"
            >
              <span>📥</span>
              <span>{isExporting === 'download' ? 'Downloading...' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
