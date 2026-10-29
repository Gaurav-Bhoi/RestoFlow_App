import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import '../src/localization/i18n';
import {
  LedgerProvider,
  useLedger,
} from '../src/features/ledger/LedgerProvider';
import { LedgerScreen } from '../src/features/ledger/LedgerScreen';
import { ExpenseFormScreen } from '../src/features/ledger/ExpenseFormScreen';
import { ExpenseDetailsScreen } from '../src/features/ledger/ExpenseDetailsScreen';
import { ExpenseReportScreen } from '../src/features/ledger/ExpenseReportScreen';
import { ExpenseReportPreviewScreen } from '../src/features/ledger/ExpenseReportPreviewScreen';
import { ExpenseReceiptScreen } from '../src/features/ledger/ExpenseReceiptScreen';
import { ExpenseRow } from '../src/features/ledger/ExpenseRow';
import { AppButton } from '../src/components/AppButton';
import { AppInput } from '../src/components/AppInput';
import { AppText } from '../src/components/AppText';
import { BottomSheetContent } from '../src/components/BottomSheet';
import { ExpenseFiltersSheet } from '../src/features/ledger/ExpenseFiltersSheet';
import { SheetOption } from '../src/components/SheetOption';
import {
  writeExpenses,
  readExpenses,
} from '../src/features/ledger/expenseStorage';
import { expenseFixtures } from './support/expenseFixtures';
import { storage } from '../src/services/storage/storage';
import type { RootStackParams } from '../src/app/navigationTypes';

let mockRestaurantId = 'ledger-ui';
jest.mock('../src/features/auth/SessionProvider', () => ({
  useSession: () => ({
    session: { role: 'owner', restaurantId: mockRestaurantId },
  }),
}));
jest.mock('../src/features/restaurant/RestaurantProvider', () => ({
  useRestaurant: () => ({ restaurant: { name: 'Saffron Kitchen' } }),
}));
const Stack = createNativeStackNavigator<RootStackParams>();
let renderer: ReactTestRenderer.ReactTestRenderer;
let ledger: ReturnType<typeof useLedger>;
function Observe() {
  ledger = useLedger();
  return null;
}
function Home() {
  return <LedgerScreen onMenu={() => {}} />;
}
const files = {
  createPdf: jest.fn(async () => 'file:///private/report.pdf'),
  savePdf: jest.fn(async () => true),
  sharePdf: jest.fn(async () => undefined),
  copyText: jest.fn(async () => undefined),
  renderReceipt: jest.fn(async () => ({
    uri: 'file:///private/page.png',
    aspectRatio: 0.707,
    pages: 3,
  })),
};
beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate'] });
  jest.setSystemTime(new Date(2026, 9, 9, 17, 30));
  mockRestaurantId = 'ledger-ui';
  NativeModules.LedgerFiles = files;
  Object.values(files).forEach(mock => mock.mockClear());
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.useRealTimers();
});
async function render(seed = true) {
  if (seed) writeExpenses(mockRestaurantId, expenseFixtures);
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider>
        <LedgerProvider>
          <Observe />
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{ headerShown: false, animation: 'none' }}
            >
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
              <Stack.Screen
                name="ExpenseDetails"
                component={ExpenseDetailsScreen}
              />
              <Stack.Screen
                name="ExpenseReceipt"
                component={ExpenseReceiptScreen}
              />
              <Stack.Screen
                name="ExpenseReport"
                component={ExpenseReportScreen}
              />
              <Stack.Screen
                name="ExpenseReportPreview"
                component={ExpenseReportPreviewScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </LedgerProvider>
      </SafeAreaProvider>,
    );
  });
}
function text() {
  return renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .flat()
    .join('\n');
}
async function button(label: string) {
  await act(async () =>
    renderer.root
      .findAllByType(AppButton)
      .find(node => node.props.children === label)!
      .props.onPress(),
  );
}
async function press(label: string) {
  await act(async () =>
    renderer.root
      .findAll(
        node =>
          node.props.accessibilityLabel === label &&
          typeof node.props.onPress === 'function',
      )
      .pop()!
      .props.onPress(),
  );
}
async function input(label: string, value: string) {
  await act(async () =>
    renderer.root
      .findAllByType(AppInput)
      .find(node => node.props.label === label)!
      .props.onChangeText(value),
  );
}
async function option(label: string) {
  await act(async () =>
    renderer.root
      .findAllByType(SheetOption)
      .find(node => node.props.label === label)!
      .props.onPress(),
  );
}

test('empty ledger creates a validated expense, shows details, edits and deletes it persistently', async () => {
  await render(false);
  expect(text()).toContain('No expenses recorded');
  await button('Add Expense');
  await button('Save Expense');
  expect(text()).toContain('Expense name is required');
  expect(text()).toContain('Enter a valid amount greater than zero');
  await input('Expense name', 'Vegetable top-up');
  await input('Amount', '₹650.10');
  const save = renderer.root
    .findAllByType(AppButton)
    .find(node => node.props.children === 'Save Expense')!.props.onPress;
  await act(async () => {
    save();
    save();
  });
  expect(ledger.expenses).toHaveLength(1);
  expect(readExpenses(mockRestaurantId)[0].amountPaise).toBe(65010);
  await act(async () => renderer.root.findByType(ExpenseRow).props.onPress());
  expect(text()).toContain('Expense Details');
  expect(text()).toContain('No receipt attached');
  await button('Edit Expense');
  await input('Amount', '₹750.25');
  await button('Save Changes');
  expect(readExpenses(mockRestaurantId)[0].amountPaise).toBe(75025);
  await press('Delete expense');
  await button('Delete');
  expect(readExpenses(mockRestaurantId)).toEqual([]);
  expect(text()).toContain('No expenses recorded');
});

test('search and nested filters retain drafts on dismissal and apply only on confirmation', async () => {
  await render();
  await press('Search expenses');
  await input('Search expenses', 'Chicken');
  expect(text()).toContain('1 matching expense');
  expect(renderer.root.findAllByType(ExpenseRow)).toHaveLength(1);
  await press('Go back');
  await press('Filter expenses');
  const filter = renderer.root.findByType(ExpenseFiltersSheet);
  await press('Payment method: All');
  expect(
    renderer.root
      .findAllByType(BottomSheetContent)
      .filter(node => node.props.title === 'Payment method'),
  ).toHaveLength(1);
  await option('Cash');
  expect(ledger.expenses).toHaveLength(9);
  expect(filter.props.filters.payment).toBe('all');
  await button('Apply Filters');
  expect(text()).toContain('No expenses found');
  await button('Clear search & filters');
  expect(renderer.root.findAllByType(ExpenseRow)).toHaveLength(9);
});

test('failed local writes leave the current ledger and saved expenses intact', async () => {
  await render();
  const fail = jest.spyOn(storage, 'setObject').mockImplementation(() => {
    throw new Error('disk full');
  });
  expect(() => ledger.remove('chicken')).toThrow('ledger.saveFailed');
  expect(ledger.expenses).toHaveLength(9);
  fail.mockRestore();
  expect(readExpenses(mockRestaurantId)).toHaveLength(9);
});

test('changing restaurant clears the previous ledger and feedback', async () => {
  writeExpenses('ledger-ui', expenseFixtures);
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <LedgerProvider>
        <Observe />
      </LedgerProvider>,
    );
  });
  expect(ledger.expenses).toHaveLength(9);
  await act(async () => ledger.remove('chicken'));
  expect(ledger.notice).toBe('ledger.expenseDeleted');
  mockRestaurantId = 'another-restaurant';
  await act(async () =>
    renderer.update(
      <LedgerProvider>
        <Observe />
      </LedgerProvider>,
    ),
  );
  expect(ledger.expenses).toEqual([]);
  expect(ledger.notice).toBe('');
  expect(readExpenses('ledger-ui')).toHaveLength(8);
});

test('PDF generation failure stays on the export form and can be retried', async () => {
  await render();
  await press('Export report');
  files.createPdf.mockRejectedValueOnce(new Error('ledger.reportFailed'));
  await button('Generate PDF');
  expect(text()).toContain('Export report');
  expect(text()).not.toContain('PDF preview');
  await button('Generate PDF');
  expect(text()).toContain('PDF preview');
});

test('receipt preview renders the actual PDF page and page count', async () => {
  writeExpenses(mockRestaurantId, [
    {
      ...expenseFixtures[0],
      receipt: {
        uri: 'file:///private/receipt.pdf',
        name: 'receipt.pdf',
        type: 'application/pdf',
      },
    },
  ]);
  await render(false);
  await act(async () => renderer.root.findByType(ExpenseRow).props.onPress());
  await press('Preview receipt: receipt.pdf');
  expect(files.renderReceipt).toHaveBeenCalledWith(
    'file:///private/receipt.pdf',
  );
  expect(text()).toContain('Page 1 of 3');
  expect(text()).toContain('Open PDF receipt');
});

test('reports pass real snapshot data to native PDF generation and cancelled downloads never claim success', async () => {
  await render();
  await press('Export report');
  await button('Generate PDF');
  expect(files.createPdf).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Expense Report',
      totals: [
        ['Daily Inventory', '₹13,650'],
        ['Miscellaneous', '₹35,100'],
        ['Grand total', '₹48,750'],
      ],
    }),
  );
  expect(files.createPdf).not.toHaveBeenCalledWith(
    expect.objectContaining({ fileName: expect.any(String) }),
  );
  expect(files.createPdf).not.toHaveBeenCalledWith(
    expect.objectContaining({ layout: 'receipt' }),
  );
  files.savePdf.mockResolvedValueOnce(false);
  await button('Download PDF');
  expect(text()).not.toContain('PDF saved');
  await button('Download PDF');
  expect(text()).toContain('PDF saved');
  expect(files.savePdf).toHaveBeenLastCalledWith(
    'file:///private/report.pdf',
    'RestoFlow-Expense-Report.pdf',
  );
  await press('Share expense report');
  await option('WhatsApp');
  expect(files.sharePdf).toHaveBeenLastCalledWith(
    'file:///private/report.pdf',
    'RestoFlow-Expense-Report.pdf',
    'whatsapp',
  );
  await press('Share expense report');
  await option('Copy report');
  expect(files.copyText).toHaveBeenCalledWith(
    expect.stringContaining('₹48,750'),
  );
});
