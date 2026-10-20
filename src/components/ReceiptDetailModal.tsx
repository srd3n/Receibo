import { useState } from 'react';
import { Expense } from '../types/expense';
import { formatCurrency, formatReceiptDate } from '../utils/formatters';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface ReceiptDetailModalProps {
  expense: Expense | null;
  currencySymbol: string;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ReceiptDetailModal({
  expense,
  currencySymbol,
  onClose,
  onEdit,
  onDelete,
}: ReceiptDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!expense) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      `RECEIPT: ${expense.receiptNumber}`,
      `MERCHANT: ${expense.merchant}`,
      `DATE: ${expense.date} ${expense.time || ''}`,
      `CATEGORY: ${expense.category}`,
      `PAYMENT: ${expense.paymentMethod}`,
      `--------------------------------`,
    ];
    if (expense.items && expense.items.length > 0) {
      expense.items.forEach((item) => {
        lines.push(`${item.quantity}x ${item.name} - ${formatCurrency(item.price, currencySymbol)}`);
      });
      lines.push(`--------------------------------`);
    }
    if (expense.tax) lines.push(`VAT: ${formatCurrency(expense.tax, currencySymbol)}`);
    if (expense.tip) lines.push(`TIP: ${formatCurrency(expense.tip, currencySymbol)}`);
    lines.push(`TOTAL: ${formatCurrency(expense.amount, currencySymbol)}`);
    if (expense.notes) lines.push(`NOTE: ${expense.notes}`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="relative w-full max-w-md my-0 sm:my-8 bg-transparent max-h-[95vh] flex flex-col">
        {/* Top Controls Toolbar */}
        <div className="flex items-center justify-between p-3 bg-stone-900/90 sm:bg-transparent text-stone-200 text-xs font-mono rounded-t-xl sm:rounded-none">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 min-h-[38px] bg-white/10 hover:bg-white/20 active:bg-white/30 rounded transition-colors text-white font-medium flex items-center justify-center"
            >
              Print Slip
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 min-h-[38px] bg-white/10 hover:bg-white/20 active:bg-white/30 rounded transition-colors text-white font-medium flex items-center justify-center"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] hover:text-white transition-colors text-sm flex items-center justify-center"
            aria-label="Close modal"
          >
            ✕ Close
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="overflow-y-auto max-h-[75vh] px-2 sm:px-0">
          <div id="printable-receipt" className="flex flex-col font-mono shadow-2xl">
            <ReceiptEdge position="top" fill="#FCFAF7" />

            <div className="bg-[#FCFAF7] border-x border-stone-300 px-5 sm:px-8 py-6 sm:py-7 text-stone-800">
              {/* Header info */}
              <div className="text-center pb-4 border-b border-stone-200">
                <span className="text-[10px] tracking-widest text-stone-400 uppercase font-semibold">
                  * OFFICIAL REGISTER SLIP *
                </span>
                <h2 id="receipt-detail-title" className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-stone-900 uppercase mt-1">
                  {expense.merchant}
                </h2>
                {expense.location && (
                  <div className="text-xs text-stone-500 mt-0.5">
                    {expense.location}
                  </div>
                )}
                <div className="text-xs text-stone-600 mt-2 flex items-center justify-center gap-2 flex-wrap">
                  <span>{formatReceiptDate(expense.date, expense.time)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-stone-700">{expense.receiptNumber}</span>
                </div>
              </div>

              {/* Category and details */}
              <div className="py-2.5 text-xs text-stone-600 flex justify-between border-b border-stone-200">
                <span>CATEGORY</span>
                <span className="font-semibold text-stone-900">{expense.category}</span>
              </div>
              <div className="py-2.5 text-xs text-stone-600 flex justify-between border-b border-stone-200">
                <span>PAYMENT METHOD</span>
                <span className="font-semibold text-stone-900">{expense.paymentMethod}</span>
              </div>

              <div className="receipt-dashed-line my-4" />

              {/* Itemized Line Items */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-2">
                  <span>Description / Qty</span>
                  <span>Amount</span>
                </div>

                {expense.items && expense.items.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {expense.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-baseline gap-2">
                        <span className="text-stone-800">
                          {item.quantity > 1 ? `${item.quantity}× ` : ''}
                          {item.name}
                        </span>
                        <span className="tabular-nums font-semibold text-stone-900 shrink-0">
                          {formatCurrency(item.price, currencySymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-stone-600 italic py-1">
                    {expense.notes || 'No individual line items recorded.'}
                  </div>
                )}
              </div>

              <div className="receipt-dashed-line my-4" />

              {/* Subtotal, tax, tip */}
              <div className="space-y-1.5 text-xs text-stone-600 mb-4">
                {expense.tax !== undefined && expense.tax > 0 && (
                  <div className="flex justify-between">
                    <span>VALUE ADDED TAX (12% VAT):</span>
                    <span className="tabular-nums">{formatCurrency(expense.tax, currencySymbol)}</span>
                  </div>
                )}
                {expense.tip !== undefined && expense.tip > 0 && (
                  <div className="flex justify-between">
                    <span>TIP / GRATUITY:</span>
                    <span className="tabular-nums">{formatCurrency(expense.tip, currencySymbol)}</span>
                  </div>
                )}
              </div>

              {/* EMPHASIZED AMOUNT SECTION */}
              <div className="my-4 p-4 bg-stone-900 text-stone-50 rounded-sm">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] tracking-widest text-stone-300 uppercase block font-semibold">
                      TOTAL AMOUNT DUE
                    </span>
                    <span className="text-xs text-stone-400">
                      PAID VIA {expense.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums text-white">
                      {formatCurrency(expense.amount, currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {expense.notes && (
                <div className="my-3 p-2.5 bg-stone-100 rounded text-xs text-stone-600">
                  <span className="font-semibold block text-[10px] uppercase text-stone-400">Notes</span>
                  {expense.notes}
                </div>
              )}

              {/* Barcode and receipt footer */}
              <div className="text-center pt-3 border-t border-stone-200">
                <Barcode value={expense.receiptNumber} />
                <div className="text-[10px] text-stone-400 mt-2 uppercase tracking-wider">
                  SALAMAT PO · RETAIN FOR YOUR RECORDS
                </div>
              </div>
            </div>

            <ReceiptEdge position="bottom" fill="#FCFAF7" />
          </div>
        </div>

        {/* Modal footer actions */}
        <div className="p-3 bg-stone-900/90 sm:bg-transparent flex items-center justify-between text-stone-300 text-xs font-mono">
          <button
            onClick={() => {
              onEdit(expense);
              onClose();
            }}
            className="hover:text-white transition-colors min-h-[44px] flex items-center font-semibold"
          >
            Edit Expense
          </button>
          <button
            onClick={() => {
              onDelete(expense.id);
              onClose();
            }}
            className="hover:text-rose-400 text-rose-300 transition-colors min-h-[44px] flex items-center font-medium"
          >
            Delete Slip
          </button>
        </div>
      </div>
    </div>
  );
}
