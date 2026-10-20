export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export type ExpenseCategory =
  | 'Food & Groceries'
  | 'Transportation'
  | 'Bills & Utilities'
  | 'Shopping'
  | 'Health & Personal Care'
  | 'Education'
  | 'Entertainment'
  | 'Housing & Rent'
  | 'Subscriptions'
  | 'Other Expenses';

export type PaymentMethod =
  | 'Cash'
  | 'GCash'
  | 'Maya'
  | 'Apple Pay'
  | 'Visa Card'
  | 'Mastercard'
  | 'Debit Card'
  | 'Bank Transfer';

export interface Expense {
  id: string;
  receiptNumber: string;
  merchant: string;
  location?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  tax?: number;
  tip?: number;
  items?: LineItem[];
  starred?: boolean;
}

export type ViewMode = 'slips' | 'compact' | 'master';

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
}

export type PaperFormat = 'thermal' | 'a4' | 'letter';
