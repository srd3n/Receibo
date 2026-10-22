import { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import ReceiptEdge from './ReceiptEdge';
import Barcode from './Barcode';

interface FirstLaunchModalProps {
  isOpen: boolean;
  onChooseLocal: () => void;
  onLoginSuccess: () => void;
}

export default function FirstLaunchModal({
  isOpen,
  onChooseLocal,
  onLoginSuccess,
}: FirstLaunchModalProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      onLoginSuccess();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Sign-in was cancelled or encountered a network error. You can also continue without an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-launch-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-lg my-6">
        {/* Receipt Paper Card */}
        <div className="relative flex flex-col font-mono shadow-2xl bg-[#FCFAF7] border border-stone-300 text-stone-800">
          <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-2xs" />

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {/* Header / Receipt Wordmark */}
            <div className="text-center pb-4 border-b border-stone-200">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                * INITIAL SETUP · RECEIBO REGISTER *
              </span>
              <h2
                id="first-launch-title"
                className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-stone-900 uppercase mt-1"
              >
                Receibo: Tally
              </h2>
              <p className="text-xs text-stone-600 mt-1 font-sans">
                Minimalist Thermal Receipt Expense Ledger
              </p>
              <div className="text-[10px] text-stone-400 mt-1">
                SESSION #01 · AUTH & DATA PREFERENCE SELECTION
              </div>
            </div>

            <div className="receipt-dashed-line my-4" />

            {/* Welcoming message */}
            <p className="text-xs text-stone-700 font-sans leading-relaxed text-center mb-4">
              Welcome to <strong>Receibo</strong>. Select how you would like to store and manage your personal expense records:
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-sans">
                {errorMsg}
              </div>
            )}

            {/* 2 Options Cards */}
            <div className="space-y-3.5">
              {/* Option B: Log In / Sign Up (Cloud Sync) */}
              <div className="p-4 bg-white rounded border-2 border-stone-900 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">☁️</span>
                    <span className="font-sans font-bold text-sm text-stone-900">
                      Cloud Account
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold bg-stone-900 text-stone-50 px-2 py-0.5 rounded">
                    Recommended
                  </span>
                </div>

                <p className="text-xs text-stone-600 font-sans leading-relaxed">
                  Automatically back up receipts to Google Cloud Firestore. Access your expense tape from any mobile device, tablet, or desktop computer.
                </p>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3 px-4 min-h-[48px] bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-semibold rounded flex items-center justify-center gap-3 transition-colors shadow-xs font-sans text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>{loading ? 'Connecting to Account...' : 'Log In / Sign Up'}</span>
                </button>
              </div>

              {/* Option A: Continue Locally (Offline) */}
              <div className="p-4 bg-stone-100/70 rounded border border-stone-300 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">💾</span>
                  <span className="font-sans font-bold text-sm text-stone-900">
                    Offline Local Ledger
                  </span>
                </div>

                <p className="text-xs text-stone-600 font-sans leading-relaxed">
                  Start tracking expenses immediately without an account. All slips, totals, and master tapes are stored in this browser's local memory.
                </p>

                <div className="text-[11px] text-amber-800/90 font-mono bg-amber-50 p-2 rounded border border-amber-200/80 leading-relaxed">
                  ⚠️ <strong>Notice:</strong> Offline data does not sync across devices and can be lost if browser cache or history is cleared. You can switch to an account anytime later without losing your records.
                </div>

                <button
                  type="button"
                  onClick={onChooseLocal}
                  disabled={loading}
                  className="w-full py-2.5 px-4 min-h-[44px] bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 border border-stone-300 font-semibold rounded transition-colors text-xs font-mono"
                >
                  Continue Without an Account
                </button>
              </div>
            </div>

            <div className="receipt-dashed-line my-4" />

            {/* Bottom Barcode & Reassurance */}
            <div className="text-center pt-1">
              <Barcode value="RECEIBO-INIT-2026" className="scale-90" />
              <div className="text-[10px] text-stone-400 font-mono tracking-wider uppercase mt-2">
                * YOUR CHOICE PERSISTS · SWITCH MODES ANYTIME *
              </div>
            </div>
          </div>

          <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-2xs" />
        </div>
      </div>
    </div>
  );
}
