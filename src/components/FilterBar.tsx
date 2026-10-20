import { CATEGORIES, CURRENCIES } from '../utils/formatters';
import { SortOption } from '../types/expense';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedCurrency: string;
  onCurrencyChange: (curr: string) => void;
  totalFiltered: number;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  selectedCurrency,
  onCurrencyChange,
  totalFiltered,
}: FilterBarProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      {/* Search and Sort row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input with 44px touch height */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search merchant, item, note..."
            className="w-full pl-3.5 pr-9 py-2.5 sm:py-2 text-base sm:text-sm bg-white border border-stone-300 rounded-md placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 font-sans min-h-[44px] sm:min-h-0"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 min-w-[32px] min-h-[32px] flex items-center justify-center text-xs font-mono"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort and Currency Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex-1 sm:flex-initial flex items-center gap-1.5 text-xs text-stone-600 font-mono">
            <span className="hidden xs:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort expenses by"
              className="w-full sm:w-auto bg-white border border-stone-300 rounded px-2.5 py-2.5 sm:py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="amount-desc">Amount (Highest)</option>
              <option value="amount-asc">Amount (Lowest)</option>
            </select>
          </div>

          <div className="flex-1 sm:flex-initial flex items-center gap-1.5 text-xs text-stone-600 font-mono">
            <span className="hidden xs:inline">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              aria-label="Select currency"
              className="w-full sm:w-auto bg-white border border-stone-300 rounded px-2.5 py-2.5 sm:py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0 font-bold"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.symbol}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Horizontal Scrolling Tabs with Touch Inertia */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar touch-pan-x -mx-1 px-1">
        <button
          onClick={() => onCategoryChange('All')}
          className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center justify-center ${
            selectedCategory === 'All'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 active:bg-stone-200'
          }`}
        >
          All ({totalFiltered})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategoryChange(cat.name)}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center justify-center ${
              selectedCategory === cat.name
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 active:bg-stone-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
