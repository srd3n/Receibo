import { Expense } from '../types/expense';
import { formatCurrency } from '../utils/formatters';

interface ReceiptStatsProps {
  expenses: Expense[];
  currencySymbol: string;
  isCloud?: boolean;
}

export default function ReceiptStats({ expenses, currencySymbol, isCloud }: ReceiptStatsProps) {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

  // Calculate highest category
  const categoryCounts: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + e.amount;
  });

  let topCategory = '—';
  let topCategoryAmount = 0;
  Object.entries(categoryCounts).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = amt;
    }
  });

  return (
    <section className="bg-stone-100/80 border border-stone-200/90 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 sm:gap-6 pb-4 sm:pb-5 border-b border-stone-200">
        <div>
          <span className="text-[10px] sm:text-xs uppercase tracking-wider font-mono text-stone-500">
            Total Ledger Expenditures
          </span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-mono tabular-nums break-all">
              {formatCurrency(totalAmount, currencySymbol)}
            </span>
            <span className="text-xs text-stone-600 font-mono">
              ({expenses.length} {expenses.length === 1 ? 'receipt' : 'receipts'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-stone-700 font-mono pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
          <div>
            <span className="text-[10px] sm:text-xs text-stone-500 block uppercase tracking-wider">
              Avg. Per Slip
            </span>
            <span className="font-semibold text-stone-900 text-sm sm:text-base tabular-nums">
              {formatCurrency(avgAmount, currencySymbol)}
            </span>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-stone-500 block uppercase tracking-wider">
              Leading Category
            </span>
            <span className="font-semibold text-stone-900 text-sm sm:text-base truncate block max-w-[140px] sm:max-w-none">
              {topCategory}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] sm:text-xs text-stone-500 block uppercase tracking-wider">
              Active Currency
            </span>
            <span className="font-medium text-stone-800 text-sm sm:text-base">
              Philippine Peso (PHP)
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 flex flex-col xs:flex-row items-start xs:items-center justify-between text-[11px] text-stone-500 font-mono gap-1">
        <span>* Verified Personal Expense Ledger & Tax Audit Records *</span>
        <span className={isCloud ? 'text-emerald-700 font-medium' : 'text-stone-400'}>
          {isCloud ? '🟢 Google Cloud Firestore' : 'Offline Local Storage'}
        </span>
      </div>
    </section>
  );
}
