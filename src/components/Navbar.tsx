import { ViewMode } from '../types/expense';
import { useAuth } from '../firebase/authContext';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewExpense: () => void;
  onExportAll: () => void;
  onOpenDownloadMasterRoll: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({
  viewMode,
  onViewModeChange,
  onOpenNewExpense,
  onExportAll,
  onOpenDownloadMasterRoll,
  onOpenLogin,
}: NavbarProps) {
  const { user } = useAuth();

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
                className="hidden sm:flex px-3 py-2 min-h-[40px] text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-md hover:bg-stone-100 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-2xs items-center gap-1.5 font-mono"
                title="Download complete master receipt roll as PDF or image"
              >
                <span>📥</span>
                <span>Download Master Roll</span>
              </button>

              {/* Login / User Status Button */}
              <button
                onClick={onOpenLogin}
                className="px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-md hover:bg-stone-100 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 shadow-2xs flex items-center gap-2"
                title={user ? `Signed in as ${user.displayName || user.email}` : 'Sign in to save your receipts to cloud'}
              >
                {user ? (
                  <>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </span>
                    )}
                    <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium text-stone-900">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">
                      ● Sync
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF7]/95 backdrop-blur-md border-t border-stone-300 px-1 py-1 shadow-lg pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-14">
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
            className="flex flex-col items-center justify-center min-h-[44px] text-stone-500 hover:text-stone-900 transition-colors"
          >
            <span className="text-base leading-none">📥</span>
            <span className="text-[10px] tracking-tight mt-1 font-mono">Download</span>
          </button>

          <button
            onClick={onOpenLogin}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              user ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {user ? (
              user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </span>
              )
            ) : (
              <span className="text-base leading-none">👤</span>
            )}
            <span className="text-[10px] tracking-tight mt-0.5 font-mono">
              {user ? 'Account' : 'Login'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
