import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { ExpenseReceipt } from '../features/ledger/types';
import type { ExpensePdfDocument } from '../features/ledger/ledgerFiles';
import type { BillDraft } from '../api/billing';

export type RootStackParams = {
  Login: undefined;
  Registration: { phone: string };
  Home: { screen?: keyof HomeTabsParams } | undefined;
  Customers: { tableId: string };
  Order: { tableId: string; customerId?: string };
  Bill: { tableId: string; customerId: string };
  BillOverview: { tableId: string; customerId: string; draft?: BillDraft };
  Receipt: {
    tableId: string;
    customerId: string;
    draft?: BillDraft;
    presentation?: 'table';
  };
  PrintSuccess: { tableId: string; customerId: string; printJobId: string };
  Language: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Waiters: undefined;
  AddWaiter: undefined;
  DishForm: { dishId?: string };
  ExpenseForm: { expenseId?: string };
  ExpenseDetails: { expenseId: string };
  ExpenseReceipt: { receipt: ExpenseReceipt };
  ExpenseReport: undefined;
  ExpenseReportPreview: { document: ExpensePdfDocument; uri: string };
  Subscription: undefined;
  Purchase: undefined;
};
export type RootScreenProps<T extends keyof RootStackParams> =
  NativeStackScreenProps<RootStackParams, T>;
export type HomeTabsParams = {
  Dashboard: undefined;
  Menu: undefined;
  Settings: undefined;
};
export const useAppNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParams>>();
