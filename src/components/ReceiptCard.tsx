import { Expense } from '../types/expense';
import { formatCurrency, formatReceiptDate } from '../utils/formatters';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface ReceiptCardProps {
  expense: Expense;
  currencySymbol: string;
  onSelect: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onDuplicate: (expense: Expense) => void;
}

export default function ReceiptCard({
  expense,
  currencySymbol,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}: ReceiptCardProps) {
  const lineItems = expense.items || [];
  const previewItems = lineItems.slice(0, 3);
  const remainingItemsCount = lineItems.length - previewItems.length;

  return (
    <article className="group relative flex flex-col transition-transform duration-150 hover:-translate-y-1 w-full max-w-full">
      {/* Jagged top tear */}
      <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-xs" />

      {/* Main Receipt Body */}
      <div className="bg-[#FCFAF7] border-x border-stone-300/80 px-4 sm:px-6 py-5 sm:py-6 text-stone-800 shadow-sm flex-1 flex flex-col justify-between font-mono">
        <div>
          {/* Header metadata: serial and date */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 pb-2.5 sm:pb-3 border-b border-stone-200">
            <span className="tracking-widest font-semibold">{expense.receiptNumber}</span>
            <span className="text-right truncate ml-2">{formatReceiptDate(expense.date, expense.time)}</span>
          </div>

          {/* Merchant title and location */}
          <div className="text-center my-3 sm:my-4">
            <h3 className="font-sans text-base sm:text-lg font-bold tracking-tight text-stone-900 uppercase">
              {expense.merchant}
            </h3>
            {expense.location && (
              <p className="text-[11px] text-stone-500 mt-0.5 tracking-tight truncate">
                {expense.location}
              </p>
            )}
            
            {/* Category and payment method metadata */}
            <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="font-semibold text-stone-700">{expense.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium">{expense.paymentMethod}</span>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="receipt-dashed-line my-3 sm:my-4" />

          {/* Line items (itemized breakdown) */}
          {lineItems.length > 0 ? (
            <div className="space-y-1.5 text-xs text-stone-700 mb-3 sm:mb-4">
              {previewItems.map((item) => (
                <div key={item.id} className="flex justify-between items-baseline gap-2">
                  <span className="truncate text-stone-800 text-[11px] sm:text-xs">
                    {item.quantity > 1 ? `${item.quantity}× ` : ''}
                    {item.name}
                  </span>
                  <span className="tabular-nums font-medium text-stone-900 shrink-0 text-[11px] sm:text-xs">
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                </div>
              ))}
              {remainingItemsCount > 0 && (
                <div className="text-[10px] sm:text-[11px] text-stone-500 pt-0.5 italic">
                  + {remainingItemsCount} more {remainingItemsCount === 1 ? 'item' : 'items'}...
                </div>
              )}
            </div>
          ) : expense.notes ? (
            <p className="text-xs text-stone-600 italic my-2 sm:my-3 line-clamp-2">
              "{expense.notes}"
            </p>
          ) : (
            <div className="text-xs text-stone-500 my-2 text-center font-mono">
              Single Transaction
            </div>
          )}

          {/* Dashed divider */}
          <div className="receipt-dashed-line my-3 sm:my-4" />

          {/* Subtotal, tax breakdown if available */}
          {expense.tax !== undefined && expense.tax > 0 && (
            <div className="flex justify-between text-[11px] text-stone-500 mb-1">
              <span>VALUE ADDED TAX (VAT)</span>
              <span className="tabular-nums">{formatCurrency(expense.tax, currencySymbol)}</span>
            </div>
          )}
          {expense.tip !== undefined && expense.tip > 0 && (
            <div className="flex justify-between text-[11px] text-stone-500 mb-2">
              <span>TIP / GRATUITY</span>
              <span className="tabular-nums">{formatCurrency(expense.tip, currencySymbol)}</span>
            </div>
          )}

          {/* HIGHLY EMPHASIZED AMOUNT SECTION */}
          <div className="my-3 py-3 px-3 sm:px-3.5 bg-stone-900 text-stone-50 rounded-sm flex items-baseline justify-between shadow-xs">
            <div>
              <span className="text-[10px] tracking-widest text-stone-300 uppercase block font-semibold">
                TOTAL PAID
              </span>
              <span className="text-[10px] text-stone-400">
                {expense.paymentMethod}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-white">
                {formatCurrency(expense.amount, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Barcode and actions footer */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-stone-200/80">
          <Barcode value={expense.receiptNumber} className="scale-90" />

          {/* Action links with mobile-friendly hitboxes */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
            <button
              onClick={() => onSelect(expense)}
              className="text-stone-900 font-bold hover:underline min-h-[36px] flex items-center"
            >
              Inspect Slip
            </button>
            <div className="flex items-center gap-1 sm:gap-3 text-stone-600">
              <button
                onClick={() => onDuplicate(expense)}
                className="hover:text-stone-900 transition-colors p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Duplicate receipt"
              >
                Copy
              </button>
              <button
                onClick={() => onEdit(expense)}
                className="hover:text-stone-900 transition-colors p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center font-medium"
                title="Edit receipt"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(expense.id)}
                className="hover:text-rose-600 text-stone-500 transition-colors p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Delete receipt"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jagged bottom tear */}
      <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-xs" />
    </article>
  );
}
