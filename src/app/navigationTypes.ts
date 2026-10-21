import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export type RootStackParams = {
  Login: undefined;
  Registration: { phone: string };
  Home: undefined;
  Customers: { tableId: string };
  Order: { tableId: string; customerId?: string };
  Bill: { tableId: string; customerId: string };
  Receipt: { tableId: string; customerId: string };
  PrintSuccess: { tableId: string; customerId: string };
  Language: undefined;
  Waiters: undefined;
  AddWaiter: undefined;
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
