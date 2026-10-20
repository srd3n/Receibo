import { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, PaymentMethod, LineItem } from '../types/expense';
import { CATEGORIES, generateReceiptNumber, formatCurrency } from '../utils/formatters';
import ReceiptEdge from './ReceiptEdge';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
  currencySymbol: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'GCash',
  'Maya',
  'Visa Card',
  'Mastercard',
  'Debit Card',
  'Apple Pay',
  'Bank Transfer',
];

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  currencySymbol,
}: ExpenseModalProps) {
  const [merchant, setMerchant] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Groceries');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [showItemized, setShowItemized] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<{ merchant?: string; amount?: string; date?: string }>({});

  useEffect(() => {
    if (initialExpense) {
      setMerchant(initialExpense.merchant);
      setLocation(initialExpense.location || '');
      setDate(initialExpense.date);
      setTime(initialExpense.time || '');
      setCategory(initialExpense.category);
      setAmount(initialExpense.amount.toString());
      setPaymentMethod(initialExpense.paymentMethod);
      setNotes(initialExpense.notes || '');
      setTax(initialExpense.tax ? initialExpense.tax.toString() : '');
      setTip(initialExpense.tip ? initialExpense.tip.toString() : '');
      setItems(initialExpense.items || []);
      setShowItemized((initialExpense.items?.length || 0) > 0);
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const hh = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');

      setMerchant('');
      setLocation('');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime(`${hh}:${min}`);
      setCategory('Food & Groceries');
      setAmount('');
      setPaymentMethod('Cash');
      setNotes('');
      setTax('');
      setTip('');
      setItems([]);
      setShowItemized(false);
    }
    setActiveMobileTab('form');
    setErrors({});
  }, [initialExpense, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      quantity: 1,
      price: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
    recalculateFromItems(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    recalculateFromItems(updated);
  };

  const handleItemChange = (id: string, field: keyof LineItem, val: string | number) => {
    const updated = items.map((i) => {
      if (i.id === id) {
        return { ...i, [field]: val };
      }
      return i;
    });
    setItems(updated);
    if (field === 'price' || field === 'quantity') {
      recalculateFromItems(updated);
    }
  };

  const recalculateFromItems = (currentItems: LineItem[]) => {
    const itemsTotal = currentItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const taxNum = Number(tax) || 0;
    const tipNum = Number(tip) || 0;
    const computed = (itemsTotal + taxNum + tipNum).toFixed(2);
    setAmount(computed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { merchant?: string; amount?: string; date?: string } = {};

    if (!merchant.trim()) {
      newErrors.merchant = 'Merchant / store name is required';
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveMobileTab('form');
      return;
    }

    const cleanItems = items.filter((i) => i.name.trim() !== '');

    const expensePayload: Expense = {
      id: initialExpense ? initialExpense.id : `exp-${Date.now()}`,
      receiptNumber: initialExpense ? initialExpense.receiptNumber : generateReceiptNumber(),
      merchant: merchant.trim(),
      location: location.trim() || undefined,
      date,
      time: time || '12:00',
      category,
      amount: parsedAmount,
      currency: currencySymbol,
      paymentMethod,
      notes: notes.trim() || undefined,
      tax: tax ? parseFloat(tax) : undefined,
      tip: tip ? parseFloat(tip) : undefined,
      items: cleanItems.length > 0 ? cleanItems : undefined,
      starred: initialExpense?.starred || false,
    };

    onSave(expensePayload);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="relative w-full max-w-3xl bg-white border-t sm:border border-stone-300 rounded-t-2xl sm:rounded-lg shadow-xl overflow-hidden max-h-[94vh] sm:max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 bg-stone-50 shrink-0">
          <div>
            <h2 id="expense-modal-title" className="text-sm sm:text-base font-bold text-stone-900 font-sans">
              {initialExpense ? 'Edit Expense Slip' : 'Log New Expense'}
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500 font-mono">
              Philippine Peso ledger slip with highlighted amount
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-sm font-mono p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Mobile View Switcher (Form vs Live Slip) */}
        <div className="lg:hidden flex border-b border-stone-200 bg-stone-100/80 px-4 py-1.5 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMobileTab('form')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded min-h-[36px] transition-colors ${
              activeMobileTab === 'form' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
            }`}
          >
            Form Details
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded min-h-[36px] transition-colors ${
              activeMobileTab === 'preview' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600'
            }`}
          >
            Live Slip Preview
          </button>
        </div>

        {/* Modal Content - 2 Column layout on desktop: Form + Live Receipt Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Form Side */}
          <form
            onSubmit={handleSubmit}
            className={`p-4 sm:p-6 space-y-4 lg:col-span-7 ${
              activeMobileTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Merchant and Amount row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Merchant / Payee *
                </label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. SM Supermarket, Jollibee"
                  className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                />
                {errors.merchant && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.merchant}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Total Amount ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-700 font-mono font-bold">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-base sm:text-sm font-mono font-bold text-stone-900 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                  />
                </div>
                {errors.amount && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.amount}</p>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-sm font-mono border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-sm font-mono border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            {/* Category and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white min-h-[44px] sm:min-h-0"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white min-h-[44px] sm:min-h-0"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Branch / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. BGC, Megamall, Makati"
                  className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Household budget"
                  className="w-full px-3 py-2 text-base sm:text-sm border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            {/* Line Items Toggle & Breakdown */}
            <div className="pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowItemized(!showItemized)}
                  className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1.5 min-h-[36px]"
                >
                  <span>{showItemized ? '▼' : '►'}</span>
                  <span>Itemized Receipt Line Items {items.length > 0 ? `(${items.length})` : ''}</span>
                </button>
                {showItemized && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded min-h-[36px] flex items-center"
                  >
                    + Add Item
                  </button>
                )}
              </div>

              {showItemized && (
                <div className="space-y-2 mt-2 bg-stone-50 p-3 rounded border border-stone-200">
                  {items.length === 0 ? (
                    <p className="text-xs text-stone-500 italic py-1">
                      No items added yet. Click "+ Add Item" to list specific goods.
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs pb-2 border-b sm:border-b-0 border-stone-200">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-stone-400 font-mono w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                            placeholder="Item name (e.g. Rice 5kg)"
                            className="flex-1 px-2.5 py-2 sm:py-1 text-sm bg-white border border-stone-300 rounded text-stone-900 min-h-[40px] sm:min-h-0"
                          />
                        </div>
                        <div className="flex items-center gap-2 pl-6 sm:pl-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-2 py-2 sm:py-1 text-sm bg-white border border-stone-300 rounded text-stone-900 font-mono min-h-[40px] sm:min-h-0"
                            title="Quantity"
                          />
                          <div className="relative flex-1 sm:w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-mono font-semibold">
                              {currencySymbol}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.price || ''}
                              onChange={(e) =>
                                handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)
                              }
                              placeholder="0.00"
                              className="w-full pl-6 pr-2 py-2 sm:py-1 text-sm bg-white border border-stone-300 rounded text-stone-900 font-mono text-right min-h-[40px] sm:min-h-0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-stone-400 hover:text-rose-600 min-h-[40px] min-w-[36px] flex items-center justify-center text-sm"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* VAT & Tip */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200 mt-2">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-stone-500 block">
                        VAT ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tax}
                        onChange={(e) => {
                          setTax(e.target.value);
                          const currentItemsTotal = items.reduce(
                            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
                            0
                          );
                          const taxVal = parseFloat(e.target.value) || 0;
                          const tipVal = parseFloat(tip) || 0;
                          if (currentItemsTotal > 0) {
                            setAmount((currentItemsTotal + taxVal + tipVal).toFixed(2));
                          }
                        }}
                        placeholder="0.00"
                        className="w-full px-2 py-2 sm:py-1 text-sm border border-stone-300 rounded bg-white font-mono min-h-[40px] sm:min-h-0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-stone-500 block">
                        Tip ({currencySymbol})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={tip}
                        onChange={(e) => {
                          setTip(e.target.value);
                          const currentItemsTotal = items.reduce(
                            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
                            0
                          );
                          const taxVal = parseFloat(tax) || 0;
                          const tipVal = parseFloat(e.target.value) || 0;
                          if (currentItemsTotal > 0) {
                            setAmount((currentItemsTotal + taxVal + tipVal).toFixed(2));
                          }
                        }}
                        placeholder="0.00"
                        className="w-full px-2 py-2 sm:py-1 text-sm border border-stone-300 rounded bg-white font-mono min-h-[40px] sm:min-h-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop / In-form buttons */}
            <div className="hidden sm:flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 min-h-[44px] text-xs font-semibold text-white bg-stone-900 rounded hover:bg-stone-800 transition-colors shadow-xs"
              >
                {initialExpense ? 'Save Changes' : 'Log Expense Slip'}
              </button>
            </div>
          </form>

          {/* Live Receipt Preview Side */}
          <div
            className={`p-4 sm:p-6 bg-stone-100/70 border-t lg:border-t-0 lg:border-l border-stone-200 lg:col-span-5 flex flex-col justify-center ${
              activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 mb-2 block text-center">
              Live Slip Preview
            </span>

            <div className="relative font-mono text-xs shadow-md max-w-sm mx-auto w-full">
              <ReceiptEdge position="top" fill="#FCFAF7" />
              <div className="bg-[#FCFAF7] border-x border-stone-300 p-4 text-stone-800">
                <div className="text-center pb-2 border-b border-stone-200">
                  <div className="font-sans font-bold uppercase text-stone-900 text-sm">
                    {merchant.trim() || 'STORE / MERCHANT'}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {location || 'Branch / Store #01'}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    {date || 'YYYY-MM-DD'} {time ? `· ${time}` : ''}
                  </div>
                </div>

                <div className="receipt-dashed-line my-3" />

                <div className="flex justify-between text-[11px] text-stone-600">
                  <span>CATEGORY</span>
                  <span className="font-semibold text-stone-800">{category}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-600 mt-1">
                  <span>PAYMENT</span>
                  <span className="text-stone-800 font-semibold">{paymentMethod}</span>
                </div>

                {items.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-stone-200 space-y-1">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-[10px]">
                        <span className="truncate pr-1">
                          {item.quantity > 1 ? `${item.quantity}× ` : ''}
                          {item.name || 'Item'}
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(Number(item.price) || 0, currencySymbol)}
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-[9px] text-stone-400 italic">
                        +{items.length - 3} more items...
                      </div>
                    )}
                  </div>
                )}

                {/* EMPHASIZED AMOUNT IN PREVIEW */}
                <div className="my-3 p-2.5 bg-stone-900 text-stone-50 rounded-xs flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-300">
                    TOTAL DUE
                  </span>
                  <span className="text-xl font-bold font-mono tabular-nums text-white">
                    {formatCurrency(parseFloat(amount) || 0, currencySymbol)}
                  </span>
                </div>

                <div className="text-center text-[9px] text-stone-400 tracking-widest mt-2">
                  * OFFICIAL PROOF OF PAYMENT *
                </div>
              </div>
              <ReceiptEdge position="bottom" fill="#FCFAF7" />
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom CTA Footer (Thumb Zone) */}
        <div className="sm:hidden p-3 border-t border-stone-200 bg-white flex items-center gap-2 shrink-0 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded min-h-[48px] flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-2 py-3 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded min-h-[48px] flex items-center justify-center shadow-xs"
          >
            {initialExpense ? 'Save Changes' : 'Log Expense Slip'}
          </button>
        </div>
      </div>
    </div>
  );
}
