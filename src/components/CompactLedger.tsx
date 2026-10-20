import { Expense } from '../types/expense';
import { formatCurrency, formatDate } from '../utils/formatters';

interface CompactLedgerProps {
  expenses: Expense[];
  currencySymbol: string;
  onSelect: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function CompactLedger({
  expenses,
  currencySymbol,
  onSelect,
  onEdit,
  onDelete,
}: CompactLedgerProps) {
  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#FCFAF7] border border-stone-300 rounded-md overflow-hidden shadow-xs font-mono">
      {/* Ledger header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 bg-stone-100/60 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest font-semibold text-stone-700">
          Transaction Register Log
        </span>
        <span className="text-xs text-stone-500">
          {expenses.length} Records
        </span>
      </div>

      {/* MOBILE LIST VIEW (shown on screens < 768px) */}
      <div className="block md:hidden divide-y divide-stone-200">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            onClick={() => onSelect(expense)}
            className="p-4 hover:bg-stone-100/70 transition-colors active:bg-stone-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-0.5">
                  <span className="font-semibold text-stone-700">{expense.receiptNumber}</span>
                  <span>·</span>
                  <span>{formatDate(expense.date)}</span>
                </div>
                <h4 className="font-sans font-bold text-sm text-stone-900 truncate uppercase">
                  {expense.merchant}
                </h4>
                <div className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-700">{expense.category}</span>
                  <span>·</span>
                  <span>{expense.paymentMethod}</span>
                </div>
              </div>

              {/* Emphasized Amount */}
              <div className="shrink-0 text-right">
                <span className="inline-block px-2.5 py-1.5 bg-stone-900 text-stone-50 font-bold text-sm tracking-tight rounded-sm tabular-nums shadow-2xs font-mono">
                  {formatCurrency(expense.amount, currencySymbol)}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
              <span className="text-[11px] text-stone-400">Tap to inspect</span>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(expense)}
                  className="hover:text-stone-900 font-medium min-h-[32px] px-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="hover:text-rose-600 text-stone-500 min-h-[32px] px-1"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW (shown on screens >= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-50/50 text-stone-500 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Receipt #</th>
              <th className="py-3 px-4 font-semibold">Merchant / Payee</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Method</th>
              <th className="py-3 px-4 font-semibold text-right">Emphasized Amount</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {expenses.map((expense) => (
              <tr
                key={expense.id}
                className="hover:bg-stone-100/60 transition-colors group cursor-pointer"
                onClick={() => onSelect(expense)}
              >
                <td className="py-3.5 px-4 text-stone-700 whitespace-nowrap">
                  {formatDate(expense.date)}
                  {expense.time && (
                    <span className="text-[10px] text-stone-500 block">
                      {expense.time}
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap font-medium">
                  {expense.receiptNumber}
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-stone-900 font-sans text-sm">
                    {expense.merchant}
                  </div>
                  {expense.items && expense.items.length > 0 ? (
                    <div className="text-[11px] text-stone-500 truncate max-w-xs">
                      {expense.items.map((i) => i.name).join(', ')}
                    </div>
                  ) : expense.notes ? (
                    <div className="text-[11px] text-stone-500 truncate max-w-xs italic">
                      {expense.notes}
                    </div>
                  ) : null}
                </td>

                <td className="py-3.5 px-4 text-stone-700 whitespace-nowrap">
                  {expense.category}
                </td>

                <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                  {expense.paymentMethod}
                </td>

                {/* EMPHASIZED AMOUNT CELL */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="inline-block px-2.5 py-1 bg-stone-900 text-stone-50 font-bold text-sm tracking-tight rounded-sm tabular-nums shadow-2xs font-mono">
                    {formatCurrency(expense.amount, currencySymbol)}
                  </span>
                </td>

                <td
                  className="py-3.5 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-2 text-stone-500">
                    <button
                      onClick={() => onEdit(expense)}
                      className="hover:text-stone-900 transition-colors px-1.5 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="hover:text-rose-600 transition-colors px-1.5 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
