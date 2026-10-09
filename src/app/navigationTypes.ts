import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export type RootStackParams = {
  Login: undefined;
  Registration: { phone: string };
  Home: undefined;
  Customers: { tableId: number };
  Order: { tableId: number; customerId?: string };
  Bill: { tableId: number; customerId: string };
  Receipt: { tableId: number; customerId: string };
  PrintSuccess: { tableId: number; customerId: string };
  Language: undefined;
  Waiters: undefined;
  AddWaiter: undefined;
  Subscription: undefined;
  Purchase: undefined;
  PurchaseSuccess: undefined;
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
