/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Expense, ViewMode, SortOption } from './types/expense';
import { INITIAL_EXPENSES } from './data/sampleExpenses';
import Navbar from './components/Navbar';
import ReceiptStats from './components/ReceiptStats';
import FilterBar from './components/FilterBar';
import ReceiptCard from './components/ReceiptCard';
import CompactLedger from './components/CompactLedger';
import MasterReceiptView from './components/MasterReceiptView';
import ExpenseModal from './components/ExpenseModal';
import ReceiptDetailModal from './components/ReceiptDetailModal';
import PrintMasterRollModal from './components/PrintMasterRollModal';
import LoginModal from './components/LoginModal';
import { useAuth } from './firebase/authContext';
import { testConnection } from './firebase/config';
import {
  subscribeToUserExpenses,
  saveExpenseToCloud,
  deleteExpenseFromCloud,
  migrateLocalExpensesToCloud,
} from './firebase/expenseService';

const STORAGE_KEY = 'tally_receipt_expenses_php_v3';
const CURRENCY_KEY = 'tally_receipt_currency_php_v3';

export default function App() {
  const { user } = useAuth();

  // Local storage state for guest mode
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_EXPENSES;
  });

  // Current active expenses (either cloud-synced or local guest)
  const [expenses, setExpenses] = useState<Expense[]>(localExpenses);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_KEY) || '₱';
    } catch {
      return '₱';
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('slips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<Expense | null>(null);
  const [isDownloadMasterRollOpen, setIsDownloadMasterRollOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Test Firestore connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // When user logs in, subscribe to their cloud Firestore expenses
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserExpenses(
        user.uid,
        (cloudExpenses) => {
          setExpenses(cloudExpenses);
        },
        (error) => {
          console.error('Failed to load cloud expenses:', error);
        }
      );
      return () => unsubscribe();
    } else {
      // Guest mode: use local storage records
      setExpenses(localExpenses);
    }
  }, [user, localExpenses]);

  // Sync guest expenses to localStorage
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localExpenses));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [localExpenses, user]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_KEY, selectedCurrency);
    } catch {
      // Ignore
    }
  }, [selectedCurrency]);

  // Filter and Sort Expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Search query filter (merchant, notes, line items, receipt number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const merchantMatch = e.merchant.toLowerCase().includes(q);
        const notesMatch = e.notes?.toLowerCase().includes(q) ?? false;
        const receiptMatch = e.receiptNumber.toLowerCase().includes(q);
        const locationMatch = e.location?.toLowerCase().includes(q) ?? false;
        const itemsMatch = e.items?.some((i) => i.name.toLowerCase().includes(q)) ?? false;
        return merchantMatch || notesMatch || receiptMatch || locationMatch || itemsMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (
          new Date(b.date + ' ' + (b.time || '00:00')).getTime() -
          new Date(a.date + ' ' + (a.time || '00:00')).getTime()
        );
      }
      if (sortBy === 'date-asc') {
        return (
          new Date(a.date + ' ' + (a.time || '00:00')).getTime() -
          new Date(b.date + ' ' + (b.time || '00:00')).getTime()
        );
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [expenses, selectedCategory, searchQuery, sortBy]);

  // Handlers for Save, Delete, Duplicate
  const handleSaveExpense = async (newExpense: Expense) => {
    if (user) {
      // Cloud user: save directly to Firestore
      try {
        await saveExpenseToCloud(user.uid, newExpense);
      } catch (err) {
        console.error('Failed to save to cloud:', err);
        alert('Could not save to cloud storage. Please check connection.');
      }
    } else {
      // Guest user: save to local storage
      setLocalExpenses((prev) => {
        const exists = prev.some((e) => e.id === newExpense.id);
        if (exists) {
          return prev.map((e) => (e.id === newExpense.id ? newExpense : e));
        }
        return [newExpense, ...prev];
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (user) {
      try {
        await deleteExpenseFromCloud(user.uid, id);
      } catch (err) {
        console.error('Failed to delete from cloud:', err);
      }
    } else {
      setLocalExpenses((prev) => prev.filter((e) => e.id !== id));
    }
    if (selectedExpenseForDetail?.id === id) {
      setSelectedExpenseForDetail(null);
    }
  };

  const handleDuplicateExpense = async (item: Expense) => {
    const duplicated: Expense = {
      ...item,
      id: `exp-${Date.now()}`,
      receiptNumber: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
      notes: item.notes ? `${item.notes} (Copy)` : 'Copy of transaction',
    };
    await handleSaveExpense(duplicated);
  };

  const handleMigrateLocalData = async () => {
    if (!user || localExpenses.length === 0) return;
    try {
      await migrateLocalExpensesToCloud(user.uid, localExpenses);
      alert(`Successfully backed up ${localExpenses.length} receipts to your cloud account!`);
    } catch (err) {
      console.error('Migration failed:', err);
      alert('Failed to back up some records to cloud.');
    }
  };

  const handleResetSampleData = () => {
    if (
      window.confirm(
        user
          ? 'Load initial sample receipts into your cloud account?'
          : 'Reset all offline receipts back to the sample receipt batch?'
      )
    ) {
      if (user) {
        INITIAL_EXPENSES.forEach((e) => saveExpenseToCloud(user.uid, e));
      } else {
        setLocalExpenses(INITIAL_EXPENSES);
      }
      setSelectedCategory('All');
      setSearchQuery('');
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = [
      'Receipt #',
      'Date',
      'Time',
      'Merchant',
      'Category',
      'Payment Method',
      'Amount (PHP)',
      'Currency',
      'Notes',
    ];
    const rows = expenses.map((e) => [
      e.receiptNumber,
      e.date,
      e.time || '',
      `"${e.merchant.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.paymentMethod}"`,
      e.amount.toFixed(2),
      selectedCurrency,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `tally-receipts-php-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* 3-Zone Navigation Header & Mobile Bottom Bar */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewExpense={() => {
          setExpenseToEdit(null);
          setIsModalOpen(true);
        }}
        onExportAll={handleExportCSV}
        onOpenDownloadMasterRoll={() => setIsDownloadMasterRollOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Cloud Sync Status Banner */}
      <div className="bg-stone-100/60 border-b border-stone-200 py-1.5 px-4 text-[11px] font-mono text-stone-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                user ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-stone-400'
              }`}
            />
            {user ? (
              <span>
                Signed in as <strong className="text-stone-900">{user.displayName || user.email}</strong> · Receipts automatically saved to Cloud Firestore
              </span>
            ) : (
              <span>
                Offline Mode (Local Storage) · Sign in with Google to sync & protect your receipts
              </span>
            )}
          </div>

          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-stone-900 font-semibold hover:underline"
          >
            {user ? 'Account Settings' : 'Sign In with Google →'}
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas with bottom padding for mobile navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        {/* Register Top Summary Stats */}
        <ReceiptStats
          expenses={filteredExpenses}
          currencySymbol={selectedCurrency}
        />

        {/* Filter, Search, Sort & Currency Switcher Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          totalFiltered={filteredExpenses.length}
        />

        {/* Dynamic Views */}
        {filteredExpenses.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-[#FCFAF7] border border-stone-300 rounded-lg p-8 sm:p-12 text-center max-w-md mx-auto my-8 sm:my-12 shadow-xs font-mono">
            <div className="text-3xl mb-3">🧾</div>
            <h3 className="font-sans font-bold text-base sm:text-lg text-stone-900 mb-1">
              No matching expense slips
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              {searchQuery || selectedCategory !== 'All'
                ? 'No receipts matched your filter parameters. Try clearing the search or category filter.'
                : user
                ? 'Your cloud receipt ledger is empty. Log your first expense slip or load sample records.'
                : 'Your receipt ledger is empty. Log your first expense slip or sign in to sync cloud records.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {(searchQuery || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2.5 text-xs font-medium bg-stone-200 text-stone-800 hover:bg-stone-300 rounded transition-colors w-full sm:w-auto min-h-[44px] flex items-center justify-center"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded transition-colors w-full sm:w-auto shadow-xs min-h-[44px] flex items-center justify-center"
              >
                + Log First Expense
              </button>
              {expenses.length === 0 && (
                <button
                  onClick={handleResetSampleData}
                  className="px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors w-full sm:w-auto min-h-[44px] flex items-center justify-center"
                >
                  Load Sample Data
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'slips' ? (
          /* Receipt Slips Grid - 1 to 3 columns of authentic thermal slips */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 items-start">
            {filteredExpenses.map((expense) => (
              <ReceiptCard
                key={expense.id}
                expense={expense}
                currencySymbol={selectedCurrency}
                onSelect={(exp) => setSelectedExpenseForDetail(exp)}
                onEdit={(exp) => {
                  setExpenseToEdit(exp);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteExpense}
                onDuplicate={handleDuplicateExpense}
              />
            ))}
          </div>
        ) : viewMode === 'compact' ? (
          /* High-density register table / mobile card ledger */
          <CompactLedger
            expenses={filteredExpenses}
            currencySymbol={selectedCurrency}
            onSelect={(exp) => setSelectedExpenseForDetail(exp)}
            onEdit={(exp) => {
              setExpenseToEdit(exp);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteExpense}
          />
        ) : (
          /* Master continuous roll view */
          <MasterReceiptView
            expenses={filteredExpenses}
            currencySymbol={selectedCurrency}
            onSelect={(exp) => setSelectedExpenseForDetail(exp)}
            onOpenExportDialog={() => setIsDownloadMasterRollOpen(true)}
          />
        )}

        {/* Bottom Utility Controls */}
        <div className="mt-12 sm:mt-16 pt-5 sm:pt-6 border-t border-stone-300 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 font-mono gap-3 text-center sm:text-left">
          <div>
            Showing {filteredExpenses.length} of {expenses.length} receipts · {user ? 'Cloud Database Storage' : 'Local Device Storage'} (₱)
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-stone-900 hover:underline font-semibold min-h-[36px] flex items-center gap-1"
            >
              <span>👤</span>
              <span>{user ? 'Account Profile' : 'Cloud Login'}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsDownloadMasterRollOpen(true)}
              className="hover:text-stone-900 transition-colors underline min-h-[36px] flex items-center"
            >
              Download Master Roll
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleExportCSV}
              className="hover:text-stone-900 transition-colors underline min-h-[36px] flex items-center"
            >
              Export CSV
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleResetSampleData}
              className="hover:text-stone-900 transition-colors underline min-h-[36px] flex items-center"
            >
              Reset Sample Receipts
            </button>
          </div>
        </div>
      </main>

      {/* Expense Modal (Add / Edit) with Mobile Ergonomics */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={expenseToEdit}
        currencySymbol={selectedCurrency}
      />

      {/* Detailed Receipt Modal (Print, Copy, Inspect) with Mobile Sheet Styling */}
      <ReceiptDetailModal
        expense={selectedExpenseForDetail}
        currencySymbol={selectedCurrency}
        onClose={() => setSelectedExpenseForDetail(null)}
        onEdit={(exp) => {
          setSelectedExpenseForDetail(null);
          setExpenseToEdit(exp);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteExpense}
      />

      {/* Download Master Roll Modal */}
      <PrintMasterRollModal
        isOpen={isDownloadMasterRollOpen}
        onClose={() => setIsDownloadMasterRollOpen(false)}
        expenses={expenses}
        currencySymbol={selectedCurrency}
      />

      {/* Login & Cloud Sync Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onMigrateLocalData={handleMigrateLocalData}
        localCount={localExpenses.length}
      />
    </div>
  );
}
