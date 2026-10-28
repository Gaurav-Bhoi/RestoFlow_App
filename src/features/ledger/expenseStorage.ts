import { storage } from '../../services/storage/storage';
import { isDateKey, MAX_AMOUNT_PAISE } from './expenseCalculations';
import {
  paymentMethods,
  inventorySubcategories,
  miscellaneousSubcategories,
  type Expense,
} from './types';

const key = (restaurantId: string) => `ledger.v1.${restaurantId}`;

export function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;
  const expense = value as Expense;
  const subcategories: readonly string[] =
    expense.category === 'inventory'
      ? inventorySubcategories
      : miscellaneousSubcategories;
  return (
    typeof expense.id === 'string' &&
    !!expense.id &&
    typeof expense.name === 'string' &&
    !!expense.name.trim() &&
    expense.name.length <= 120 &&
    ['inventory', 'miscellaneous'].includes(expense.category) &&
    (expense.subcategory === '' ||
      subcategories.includes(expense.subcategory)) &&
    Number.isSafeInteger(expense.amountPaise) &&
    expense.amountPaise > 0 &&
    expense.amountPaise <= MAX_AMOUNT_PAISE &&
    typeof expense.date === 'string' &&
    isDateKey(expense.date) &&
    typeof expense.time === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(expense.time) &&
    typeof expense.vendor === 'string' &&
    typeof expense.notes === 'string' &&
    (!expense.payment || paymentMethods.includes(expense.payment)) &&
    (!expense.receipt ||
      (typeof expense.receipt.uri === 'string' &&
        expense.receipt.uri.startsWith('file://') &&
        typeof expense.receipt.name === 'string' &&
        ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
          expense.receipt.type,
        )))
  );
}

export function readExpenses(restaurantId: string): Expense[] {
  const encoded = storage.getString(key(restaurantId));
  if (encoded === undefined) return [];
  const parsed: unknown = JSON.parse(encoded);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(isExpense) ||
    new Set(parsed.map(value => value.id)).size !== parsed.length
  )
    throw new Error('Invalid ledger data');
  return parsed;
}

export function writeExpenses(restaurantId: string, expenses: Expense[]) {
  storage.setObject(key(restaurantId), expenses);
}
