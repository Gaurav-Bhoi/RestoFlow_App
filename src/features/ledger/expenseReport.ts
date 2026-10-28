import type { TFunction } from 'i18next';
import {
  filterExpenses,
  periodBounds,
  totalExpenses,
} from './expenseCalculations';
import { expenseDate, expenseMoney } from './expenseFormatting';
import type { ExpensePdfDocument } from './ledgerFiles';
import type { Expense, ExpenseFilters } from './types';

export function buildExpenseReport(
  expenses: Expense[],
  filters: ExpenseFilters,
  restaurant: string,
  generated: Date,
  t: TFunction,
  language: string,
): ExpensePdfDocument {
  const selected = filterExpenses(expenses, filters, '', generated);
  const bounds = periodBounds(
    filters.period,
    filters.from,
    filters.to,
    generated,
  );
  const period =
    bounds.from === bounds.to
      ? expenseDate(bounds.from, language)
      : `${expenseDate(bounds.from, language)} – ${expenseDate(
          bounds.to,
          language,
        )}`;
  return {
    restaurant,
    title: t('ledger.reportTitle'),
    period,
    generated: t('ledger.generatedOn', {
      date: expenseDate(
        `${generated.getFullYear()}-${String(generated.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(generated.getDate()).padStart(2, '0')}`,
        language,
      ),
    }),
    columns: [
      t('ledger.date'),
      t('ledger.expense'),
      t('ledger.category'),
      t('ledger.amount'),
    ],
    rows: selected.map(expense => [
      expenseDate(expense.date, language).replace(/\s+\d{4}$/, ''),
      expense.name,
      t(
        expense.category === 'inventory'
          ? 'ledger.inventoryShort'
          : 'ledger.miscShort',
      ),
      expenseMoney(expense.amountPaise),
    ]),
    totals: [
      [
        t('ledger.options.inventory'),
        expenseMoney(
          totalExpenses(
            selected.filter(expense => expense.category === 'inventory'),
          ),
        ),
      ],
      [
        t('ledger.options.miscellaneous'),
        expenseMoney(
          totalExpenses(
            selected.filter(expense => expense.category === 'miscellaneous'),
          ),
        ),
      ],
      [t('ledger.grandTotal'), expenseMoney(totalExpenses(selected))],
    ],
  };
}

export const reportText = (document: ExpensePdfDocument) =>
  [
    'RestoFlow',
    document.restaurant,
    document.title,
    document.period,
    document.generated,
    '',
    document.columns.join(' | '),
    ...document.rows.map(row => row.join(' | ')),
    '',
    ...document.totals.map(row => row.join(': ')),
  ].join('\n');
