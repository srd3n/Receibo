import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Expense } from '../types/expense';
import { handleFirestoreError, OperationType } from './errors';

export function subscribeToUserExpenses(
  userId: string,
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/expenses`;
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const q = query(expensesRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        expenses.push({
          id: data.id || docSnap.id,
          receiptNumber: data.receiptNumber || 'RCP-00000',
          merchant: data.merchant || 'Store',
          location: data.location || undefined,
          date: data.date,
          time: data.time || '12:00',
          category: data.category,
          amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
          currency: data.currency || '₱',
          paymentMethod: data.paymentMethod || 'Cash',
          notes: data.notes || undefined,
          tax: typeof data.tax === 'number' ? data.tax : undefined,
          tip: typeof data.tip === 'number' ? data.tip : undefined,
          items: Array.isArray(data.items) ? data.items : undefined,
          starred: Boolean(data.starred),
        });
      });
      onData(expenses);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

export async function saveExpenseToCloud(userId: string, expense: Expense): Promise<void> {
  const docPath = `users/${userId}/expenses/${expense.id}`;
  try {
    const expenseDocRef = doc(db, 'users', userId, 'expenses', expense.id);
    const cleanPayload: Record<string, unknown> = {
      id: expense.id,
      userId,
      receiptNumber: expense.receiptNumber,
      merchant: expense.merchant,
      date: expense.date,
      time: expense.time || '12:00',
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency || '₱',
      paymentMethod: expense.paymentMethod,
      starred: Boolean(expense.starred),
      updatedAt: new Date().toISOString(),
    };

    if (expense.location) cleanPayload.location = expense.location;
    if (expense.notes) cleanPayload.notes = expense.notes;
    if (typeof expense.tax === 'number') cleanPayload.tax = expense.tax;
    if (typeof expense.tip === 'number') cleanPayload.tip = expense.tip;
    if (expense.items && expense.items.length > 0) {
      cleanPayload.items = expense.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));
    }

    await setDoc(expenseDocRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteExpenseFromCloud(userId: string, expenseId: string): Promise<void> {
  const docPath = `users/${userId}/expenses/${expenseId}`;
  try {
    const expenseDocRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(expenseDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function migrateLocalExpensesToCloud(
  userId: string,
  localExpenses: Expense[],
  existingCloudExpenses: Expense[] = []
): Promise<number> {
  const existingIds = new Set(existingCloudExpenses.map((e) => e.id));
  const existingKeys = new Set(
    existingCloudExpenses.map((e) => `${e.receiptNumber}-${e.date}-${e.amount}`)
  );

  // Filter out any items that already exist in cloud storage
  const toUpload = localExpenses.filter(
    (exp) => !existingIds.has(exp.id) && !existingKeys.has(`${exp.receiptNumber}-${exp.date}-${exp.amount}`)
  );

  if (toUpload.length === 0) return 0;
  let count = 0;
  const batch = writeBatch(db);

  for (const exp of toUpload) {
    const ref = doc(db, 'users', userId, 'expenses', exp.id);
    const cleanPayload: Record<string, unknown> = {
      id: exp.id,
      userId,
      receiptNumber: exp.receiptNumber,
      merchant: exp.merchant,
      date: exp.date,
      time: exp.time || '12:00',
      category: exp.category,
      amount: exp.amount,
      currency: exp.currency || '₱',
      paymentMethod: exp.paymentMethod,
      starred: Boolean(exp.starred),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (exp.location) cleanPayload.location = exp.location;
    if (exp.notes) cleanPayload.notes = exp.notes;
    if (typeof exp.tax === 'number') cleanPayload.tax = exp.tax;
    if (typeof exp.tip === 'number') cleanPayload.tip = exp.tip;
    if (exp.items && exp.items.length > 0) {
      cleanPayload.items = exp.items;
    }
    batch.set(ref, cleanPayload, { merge: true });
    count++;
  }

  const batchPath = `users/${userId}/expenses`;
  try {
    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, batchPath);
  }
}
