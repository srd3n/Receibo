import { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import ReceiptEdge from './ReceiptEdge';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrateLocalData?: () => Promise<void>;
  localCount?: number;
}

export default function LoginModal({
  isOpen,
  onClose,
  onMigrateLocalData,
  localCount = 0,
}: LoginModalProps) {
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Sign-in was cancelled or encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signOutUser();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLocal = async () => {
    if (!onMigrateLocalData) return;
    try {
      setMigrating(true);
      await onMigrateLocalData();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Failed to sync offline receipts to cloud.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="relative w-full max-w-md my-6">
        {/* Top Close bar */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white text-xs font-mono px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {/* Receipt Paper Card */}
        <div className="relative flex flex-col font-mono shadow-2xl bg-[#FCFAF7] border border-stone-300 text-stone-800">
          <ReceiptEdge position="top" fill="#FCFAF7" className="drop-shadow-2xs" />

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            {/* Store / Receipt Header */}
            <div className="text-center pb-4 border-b border-stone-200">
              <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                * RECEIBO : TALLY · USER AUTHENTICATION *
              </span>
              <h2 id="login-modal-title" className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-stone-900 uppercase mt-1">
                {user ? 'Account Profile' : 'Cloud Sync Login'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {user ? 'Verified Cloud Database Session' : 'Save & Protect Your Expense Records'}
              </p>
            </div>

            <div className="receipt-dashed-line my-4" />

            {errorMsg && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-sans">
                {errorMsg}
              </div>
            )}

            {user ? (
              /* Signed-in State */
              <div className="space-y-4">
                <div className="p-4 bg-stone-100 rounded-md border border-stone-200 flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border border-stone-300 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-lg font-sans">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold font-sans text-stone-900 text-sm truncate">
                      {user.displayName || 'Receipt Keeper'}
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                      {user.email}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                      <span>✓ Cloud Storage Active</span>
                    </div>
                  </div>
                </div>

                {localCount > 0 && onMigrateLocalData && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 space-y-2">
                    <p>
                      You have <strong>{localCount}</strong> offline {localCount === 1 ? 'receipt' : 'receipts'} saved on this device.
                    </p>
                    <button
                      onClick={handleSyncLocal}
                      disabled={migrating}
                      className="w-full py-2 bg-stone-900 text-white rounded font-semibold hover:bg-stone-800 transition-colors shadow-2xs"
                    >
                      {migrating ? 'Uploading...' : 'Sync Offline Receipts to Cloud'}
                    </button>
                  </div>
                )}

                <div className="text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="flex justify-between">
                    <span>DATABASE:</span>
                    <span className="font-semibold text-stone-800">Google Cloud Firestore</span>
                  </div>
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="font-semibold text-emerald-600">Online & Synchronized</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full py-2.5 min-h-[44px] text-xs font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded transition-colors"
                  >
                    {loading ? 'Signing out...' : 'Sign Out of Account'}
                  </button>
                </div>
              </div>
            ) : (
              /* Signed-out / Login State */
              <div className="space-y-4">
                <div className="text-xs text-stone-600 space-y-2 font-sans leading-relaxed">
                  <p className="font-semibold text-stone-900">
                    Why log in with Google?
                  </p>
                  <ul className="space-y-1.5 pl-1 font-mono text-stone-600 text-[11px]">
                    <li>• <strong>Cloud Persistence:</strong> Never lose receipts if cache is cleared.</li>
                    <li>• <strong>Multi-Device:</strong> Access receipts from your phone, laptop, or tablet.</li>
                    <li>• <strong>Audit Ledger:</strong> Retain master audit roll for taxation and budgeting.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full py-3 px-4 min-h-[48px] bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-md flex items-center justify-center gap-3 transition-colors shadow-xs active:scale-[0.99]"
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
                    <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={onClose}
                    className="text-stone-500 hover:text-stone-800 text-xs font-mono underline"
                  >
                    Continue as Guest (Local storage only)
                  </button>
                </div>
              </div>
            )}

            <div className="receipt-dashed-line my-4" />

            {/* Footer stamp */}
            <div className="text-center pt-1 text-[10px] text-stone-400 font-mono tracking-wider uppercase">
              * SECURE SSL & FIRESTORE CLOUD STORAGE *
            </div>
          </div>

          <ReceiptEdge position="bottom" fill="#FCFAF7" className="drop-shadow-2xs" />
        </div>
      </div>
    </div>
  );
}
