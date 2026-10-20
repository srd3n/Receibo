import { ViewMode } from '../types/expense';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewExpense: () => void;
  onExportAll: () => void;
  onOpenDownloadMasterRoll: () => void;
}

export default function Navbar({
  viewMode,
  onViewModeChange,
  onOpenNewExpense,
  onExportAll,
  onOpenDownloadMasterRoll,
}: NavbarProps) {
  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F4F0]/95 backdrop-blur-md border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16">
            {/* Zone 1: Single text element wordmark */}
            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onViewModeChange('slips');
                }}
                className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 font-sans"
              >
                TallyReceipt
              </a>
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 bg-stone-200/80 px-1.5 py-0.5 rounded hidden xs:inline-block">
                PHP · ₱
              </span>
            </div>

            {/* Zone 2: Desktop Navigation links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button
                onClick={() => onViewModeChange('slips')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'slips'
                    ? 'text-stone-950 font-semibold underline underline-offset-8 decoration-2 decoration-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Receipt Slips
              </button>
              <button
                onClick={() => onViewModeChange('compact')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'compact'
                    ? 'text-stone-950 font-semibold underline underline-offset-8 decoration-2 decoration-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Compact Ledger
              </button>
              <button
                onClick={() => onViewModeChange('master')}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'master'
                    ? 'text-stone-950 font-semibold underline underline-offset-8 decoration-2 decoration-stone-900'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Master Roll
              </button>
              <button
                onClick={onExportAll}
                className="text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
              >
                Export CSV
              </button>
            </nav>

            {/* Zone 3: Primary Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenDownloadMasterRoll}
                className="px-3 py-2 min-h-[40px] text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-md hover:bg-stone-100 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-2xs flex items-center gap-1.5 font-mono"
                title="Download complete master receipt roll as PDF or image"
              >
                <span>📥</span>
                <span className="hidden sm:inline">Download Master Roll</span>
                <span className="sm:hidden">Download</span>
              </button>

              <button
                onClick={onOpenNewExpense}
                className="px-3.5 sm:px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-stone-900 rounded-md hover:bg-stone-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
              >
                <span>+</span>
                <span className="hidden xs:inline">Log Expense</span>
                <span className="xs:hidden">Log</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Ergonomic Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF7]/95 backdrop-blur-md border-t border-stone-300 px-2 py-1 shadow-lg pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-14">
          <button
            onClick={() => onViewModeChange('slips')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              viewMode === 'slips' ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="text-base leading-none">🧾</span>
            <span className="text-[10px] tracking-tight mt-1 font-mono">Slips</span>
          </button>

          <button
            onClick={() => onViewModeChange('compact')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              viewMode === 'compact' ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="text-base leading-none">📋</span>
            <span className="text-[10px] tracking-tight mt-1 font-mono">Ledger</span>
          </button>

          <button
            onClick={() => onViewModeChange('master')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              viewMode === 'master' ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="text-base leading-none">📜</span>
            <span className="text-[10px] tracking-tight mt-1 font-mono">Roll</span>
          </button>

          <button
            onClick={onOpenDownloadMasterRoll}
            className="flex flex-col items-center justify-center min-h-[44px] text-stone-900 hover:text-black"
          >
            <div className="w-7 h-7 bg-stone-900 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
              📥
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-mono font-semibold">Download</span>
          </button>
        </div>
      </nav>
    </>
  );
}
