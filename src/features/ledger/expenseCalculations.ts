import type { Expense, ExpenseFilters, ExpensePeriod } from './types';

export const MAX_AMOUNT_PAISE = 99_999_999_999;

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isDateKey(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(localDate(value).getTime()) &&
    dateKey(localDate(value)) === value
  );
}

export function periodBounds(
  period: ExpensePeriod,
  from: string,
  to: string,
  now = new Date(),
) {
  const today = localDate(dateKey(now));
  switch (period) {
    case 'today':
      return { from: dateKey(today), to: dateKey(today) };
    case 'yesterday':
      today.setDate(today.getDate() - 1);
      return { from: dateKey(today), to: dateKey(today) };
    case 'thisWeek': {
      const start = new Date(today);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: dateKey(start), to: dateKey(end) };
    }
    case 'thisMonth':
      return {
        from: dateKey(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: dateKey(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      };
    case 'lastMonth':
      return {
        from: dateKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        to: dateKey(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case 'custom':
      return { from, to };
  }
}

export function defaultExpenseFilters(now = new Date()): ExpenseFilters {
  return {
    period: 'thisMonth',
    from: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: dateKey(now),
    category: 'all',
    payment: 'all',
    min: '',
    max: '',
  };
}

// Keep money in integer paise throughout storage, filtering and totals.
export function parseAmount(value: string): number | undefined {
  const cleaned = value.replace(/[₹,\s]/g, '');
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return undefined;
  const [whole, fraction = ''] = cleaned.split('.');
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(paise) && paise <= MAX_AMOUNT_PAISE
    ? paise
    : undefined;
}

export function filterExpenses(
  expenses: Expense[],
  filters: ExpenseFilters,
  search = '',
  now = new Date(),
  includePeriod = true,
) {
  const query = search.trim().toLocaleLowerCase();
  const bounds = periodBounds(filters.period, filters.from, filters.to, now);
  const min = parseAmount(filters.min);
  const max = parseAmount(filters.max);
  return expenses
    .filter(
      expense =>
        (!includePeriod ||
          (expense.date >= bounds.from && expense.date <= bounds.to)) &&
        (filters.category === 'all' || expense.category === filters.category) &&
        (filters.payment === 'all' || expense.payment === filters.payment) &&
        (min === undefined || expense.amountPaise >= min) &&
        (max === undefined || expense.amountPaise <= max) &&
        (!query ||
          [
            expense.name,
            expense.category === 'inventory'
              ? 'Daily Inventory'
              : 'Miscellaneous',
            expense.subcategory.replace(/([A-Z])/g, ' $1'),
            expense.vendor,
            expense.notes,
          ].some(value => value.toLocaleLowerCase().includes(query))),
    )
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
}

export const totalExpenses = (expenses: Expense[]) =>
  expenses.reduce((total, expense) => total + expense.amountPaise, 0);

export function filterValidation(filters: ExpenseFilters) {
  if (
    filters.period === 'custom' &&
    (!isDateKey(filters.from) ||
      !isDateKey(filters.to) ||
      filters.from > filters.to)
  )
    return 'ledger.invalidRange';
  const min = parseAmount(filters.min);
  const max = parseAmount(filters.max);
  if (
    (filters.min.trim() && min === undefined) ||
    (filters.max.trim() && max === undefined)
  )
    return 'ledger.invalidAmount';
  if (min !== undefined && max !== undefined && min > max)
    return 'ledger.invalidLimits';
  return undefined;
}
