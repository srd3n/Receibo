import { ExpenseCategory } from '../types/expense';

export const CURRENCIES = [
  { code: 'PHP', symbol: '₱', label: 'PHP (₱)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($)' },
];

export const CATEGORIES: { name: ExpenseCategory; code: string; icon: string }[] = [
  { name: 'Food & Groceries', code: 'FOOD', icon: 'ShoppingBag' },
  { name: 'Transportation', code: 'TRAN', icon: 'Car' },
  { name: 'Bills & Utilities', code: 'UTIL', icon: 'Zap' },
  { name: 'Shopping', code: 'SHOP', icon: 'Tag' },
  { name: 'Health & Personal Care', code: 'CARE', icon: 'HeartPulse' },
  { name: 'Education', code: 'EDUC', icon: 'GraduationCap' },
  { name: 'Entertainment', code: 'ENTR', icon: 'Film' },
  { name: 'Housing & Rent', code: 'RENT', icon: 'Home' },
  { name: 'Subscriptions', code: 'SUBS', icon: 'CreditCard' },
  { name: 'Other Expenses', code: 'MISC', icon: 'MoreHorizontal' },
];

export function formatCurrency(amount: number, symbol: string = '₱'): string {
  const parts = Math.abs(amount).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${integerPart}.${parts[1]}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatReceiptDate(dateStr: string, timeStr?: string): string {
  const formatted = formatDate(dateStr);
  if (timeStr) {
    return `${formatted} · ${timeStr}`;
  }
  return formatted;
}

export function generateReceiptNumber(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RCP-${rand}`;
}
