import '../src/localization/i18n';
import i18n from '../src/localization/i18n';
import {
  dateKey,
  defaultExpenseFilters,
  filterExpenses,
  filterValidation,
  isDateKey,
  parseAmount,
  periodBounds,
  totalExpenses,
} from '../src/features/ledger/expenseCalculations';
import {
  readExpenses,
  writeExpenses,
} from '../src/features/ledger/expenseStorage';
import {
  validateExpenseDraft,
  type ExpenseDraft,
} from '../src/features/ledger/useExpenseForm';
import { buildExpenseReport } from '../src/features/ledger/expenseReport';
import { storage } from '../src/services/storage/storage';
import { expenseFixtures } from './support/expenseFixtures';
import { formatCurrency } from '../src/utils/currency';

const now = new Date(2026, 9, 9, 17, 30);
const filters = defaultExpenseFilters(now);

test.each([
  ['0.00', '₹0'],
  ['99.05', '₹99.05'],
  ['1000.00', '₹1,000'],
  ['48750.00', '₹48,750'],
  ['12345678.99', '₹1,23,45,678.99'],
  ['9007199254740993.01', '₹9,00,71,99,25,47,40,993.01'],
])(
  'Indian currency grouping preserves exact digits without BigInt locale support: %s',
  (value, expected) => {
    expect(formatCurrency(value)).toBe(expected);
  },
);

test('all screenshot totals derive from the same entries, including add and delete states', () => {
  expect(totalExpenses(filterExpenses(expenseFixtures, filters, '', now))).toBe(
    4_875_000,
  );
  expect(
    totalExpenses(
      filterExpenses(expenseFixtures, { ...filters, period: 'today' }, '', now),
    ),
  ).toBe(570_000);
  expect(
    totalExpenses(
      filterExpenses(
        expenseFixtures,
        { ...filters, period: 'thisWeek' },
        '',
        now,
      ),
    ),
  ).toBe(2_665_000);
  expect(
    totalExpenses(
      filterExpenses(
        expenseFixtures,
        { ...filters, period: 'yesterday' },
        '',
        now,
      ),
    ),
  ).toBe(1_800_000);
  expect(
    totalExpenses(expenseFixtures.filter(item => item.id !== 'vegetables')),
  ).toBe(4_755_000);
  expect(
    totalExpenses([
      ...expenseFixtures,
      { ...expenseFixtures[2], id: 'new', date: dateKey(now) },
    ]),
  ).toBe(6_675_000);
});

test.each(['Chicken', 'chicken', 'ABC Chicken Suppliers', '25 kg'])(
  'search finds names, vendors and notes: %s',
  query => {
    expect(
      filterExpenses(expenseFixtures, filters, query, now).map(item => item.id),
    ).toEqual(['chicken']);
  },
);

test('category, payment, amount and inclusive custom dates intersect and sort newest first', () => {
  const selected = filterExpenses(
    expenseFixtures,
    {
      ...filters,
      period: 'custom',
      from: '2026-10-06',
      to: '2026-10-09',
      category: 'inventory',
      payment: 'upi',
      min: '1500',
      max: '4500',
    },
    '',
    now,
  );
  expect(selected.map(item => item.id)).toEqual(['chicken', 'dairy']);
  expect(
    filterExpenses(expenseFixtures, { ...filters, payment: 'cash' }, '', now),
  ).toEqual([]);
  expect(filterExpenses(expenseFixtures, filters, 'missing', now)).toEqual([]);
});

test('calendar boundaries handle leap days, Monday weeks and year transitions without UTC drift', () => {
  expect(isDateKey('2028-02-29')).toBe(true);
  expect(isDateKey('2026-02-29')).toBe(false);
  expect(isDateKey('2026-13-01')).toBe(false);
  expect(periodBounds('lastMonth', '', '', new Date(2026, 0, 1))).toEqual({
    from: '2025-12-01',
    to: '2025-12-31',
  });
  expect(periodBounds('thisWeek', '', '', new Date(2026, 9, 11))).toEqual({
    from: '2026-10-05',
    to: '2026-10-11',
  });
  expect(periodBounds('thisMonth', '', '', new Date(2028, 1, 12))).toEqual({
    from: '2028-02-01',
    to: '2028-02-29',
  });
});

test.each([
  '-1',
  '1e3',
  '0.001',
  '1.999',
  'NaN',
  'Infinity',
  '1000000000',
  '',
  '.',
])('rejects invalid money without rounding it: %s', value =>
  expect(parseAmount(value)).toBeUndefined(),
);

test('decimal money uses integer paise and range validation supports zero minimum', () => {
  expect(parseAmount('₹4,500.05')).toBe(450005);
  expect(parseAmount('0.10')! + parseAmount('0.20')!).toBe(30);
  expect(
    filterValidation({ ...filters, min: '0', max: '0.01' }),
  ).toBeUndefined();
  expect(filterValidation({ ...filters, min: '10', max: '2' })).toBe(
    'ledger.invalidLimits',
  );
  expect(filterValidation({ ...filters, min: 'invalid' })).toBe(
    'ledger.invalidAmount',
  );
  expect(
    filterValidation({
      ...filters,
      period: 'custom',
      from: '2026-10-10',
      to: '2026-10-09',
    }),
  ).toBe('ledger.invalidRange');
});

test('form validation preserves optional fields but requires a name, positive amount, date and time', () => {
  const draft: ExpenseDraft = {
    ...expenseFixtures[0],
    amount: '0',
    name: '',
    subcategory: '',
    vendor: '',
    notes: '',
    payment: undefined,
  };
  expect(validateExpenseDraft(draft)).toMatchObject({
    name: 'ledger.nameRequired',
    amount: 'ledger.validAmountRequired',
  });
  expect(
    Object.values(
      validateExpenseDraft({ ...draft, name: 'Test', amount: '0.01' }),
    ).some(Boolean),
  ).toBe(false);
  expect(
    validateExpenseDraft({ ...draft, date: '2026-02-30', time: '24:00' }),
  ).toMatchObject({ date: 'ledger.invalidRange', time: 'ledger.invalidTime' });
});

test('persistence is restaurant scoped and refuses corrupted data instead of silently overwriting it', () => {
  writeExpenses('restaurant-a', expenseFixtures);
  expect(readExpenses('restaurant-a')).toEqual(expenseFixtures);
  expect(readExpenses('restaurant-b')).toEqual([]);
  storage.setString('ledger.v1.restaurant-a', '{broken');
  expect(() => readExpenses('restaurant-a')).toThrow();
  storage.setObject('ledger.v1.restaurant-a', [
    { ...expenseFixtures[0], amountPaise: -1 },
  ]);
  expect(() => readExpenses('restaurant-a')).toThrow();
  storage.setObject('ledger.v1.restaurant-a', [
    expenseFixtures[0],
    expenseFixtures[0],
  ]);
  expect(() => readExpenses('restaurant-a')).toThrow();
});

test('report preview, PDF rows and totals share one filtered immutable snapshot', () => {
  const report = buildExpenseReport(
    expenseFixtures,
    filters,
    'Saffron Kitchen',
    now,
    i18n.t,
    'en-IN',
  );
  expect(report.rows).toHaveLength(9);
  expect(report.totals.map(row => row[1])).toEqual([
    '₹13,650',
    '₹35,100',
    '₹48,750',
  ]);
  const today = buildExpenseReport(
    expenseFixtures,
    { ...filters, period: 'today' },
    'Saffron Kitchen',
    now,
    i18n.t,
    'en-IN',
  );
  expect(today.rows).toHaveLength(2);
  expect(today.totals.map(row => row[1])).toEqual(['₹5,700', '₹0', '₹5,700']);
  expect(
    buildExpenseReport([], filters, 'Kitchen', now, i18n.t, 'mr').totals.map(
      row => row[1],
    ),
  ).toEqual(['₹0', '₹0', '₹0']);
});
