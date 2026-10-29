import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { colors, motion } from '../theme/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ConfirmationSheet } from '../components/ConfirmationSheet';
import { useSession } from '../features/auth/SessionProvider';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegistrationScreen } from '../features/auth/RegistrationScreen';
import { DashboardScreen } from '../features/tables/DashboardScreen';
import { CustomersScreen } from '../features/orders/CustomersScreen';
import { OrderScreen } from '../features/orders/OrderScreen';
import { BillOverviewScreen } from '../features/billing/BillOverviewScreen';
import { BillScreen } from '../features/billing/BillScreen';
import { ReceiptScreen } from '../features/billing/ReceiptScreen';
import { PrintSuccessScreen } from '../features/billing/PrintSuccessScreen';
import { MenuScreen } from '../features/menu/MenuScreen';
import { DishFormScreen } from '../features/menu/DishFormScreen';
import { MenuProvider } from '../features/menu/MenuProvider';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { LanguageScreen } from '../features/settings/LanguageScreen';
import { EditProfileScreen } from '../features/settings/EditProfileScreen';
import { ChangePasswordScreen } from '../features/settings/ChangePasswordScreen';
import { WaitersScreen } from '../features/employees/WaitersScreen';
import { AddWaiterScreen } from '../features/employees/AddWaiterScreen';
import { SubscriptionScreen } from '../features/subscription/SubscriptionScreen';
import { PurchaseScreen } from '../features/subscription/PurchaseScreen';
import { useSubscription } from '../features/subscription/useSubscription';
import { FloatingTabBar } from './FloatingTabBar';
import type { HomeTabsParams, RootStackParams } from './navigationTypes';
import { hideStartupSplash } from './bootstrap';

import { LedgerProvider } from '../features/ledger/LedgerProvider';
import { ExpenseFormScreen } from '../features/ledger/ExpenseFormScreen';
import { ExpenseDetailsScreen } from '../features/ledger/ExpenseDetailsScreen';
import { ExpenseReceiptScreen } from '../features/ledger/ExpenseReceiptScreen';
import { ExpenseReportScreen } from '../features/ledger/ExpenseReportScreen';
import { ExpenseReportPreviewScreen } from '../features/ledger/ExpenseReportPreviewScreen';

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator<HomeTabsParams>();
const navigationRef = createNavigationContainerRef<RootStackParams>();
const renderTabBar = (props: BottomTabBarProps) => (
  <FloatingTabBar {...props} />
);
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.forest,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
  },
};
function HomeScreen() {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.paper },
        }}
        tabBar={renderTabBar}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Menu" component={MenuScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </>
  );
}
export function AppNavigator() {
  const { t } = useTranslation();
  const { session, signOut } = useSession();
  const isReducedMotion = useReducedMotion();
  const { isExpired } = useSubscription();
  const [currentRoute, setCurrentRoute] = useState<string>();
  const canPurchase = session?.role === 'owner';
  const isPurchasing = currentRoute === 'Purchase';
  const updateCurrentRoute = () =>
    setCurrentRoute(navigationRef.getCurrentRoute()?.name);
  return (
    <MenuProvider key={session?.restaurantId ?? 'signed-out'}>
      <LedgerProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={theme}
          onReady={() => {
            updateCurrentRoute();
            hideStartupSplash();
          }}
          onStateChange={updateCurrentRoute}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: isReducedMotion ? 'none' : 'fade',
              animationDuration: motion.route,
              contentStyle: { backgroundColor: colors.paper },
              statusBarStyle: 'dark',
              statusBarHidden: false,
            }}
          >
            {!session ? (
              <Stack.Group navigationKey="signed-out">
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen
                  name="Registration"
                  component={RegistrationScreen}
                />
              </Stack.Group>
            ) : (
              <Stack.Group navigationKey={session.phone}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Customers" component={CustomersScreen} />
                <Stack.Screen name="Order" component={OrderScreen} />
                <Stack.Screen name="Language" component={LanguageScreen} />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                />
                <Stack.Screen
                  name="ChangePassword"
                  component={ChangePasswordScreen}
                />
                {session.role === 'owner' && (
                  <>
                    <Stack.Screen name="Bill" component={BillScreen} />
                    <Stack.Screen
                      name="BillOverview"
                      component={BillOverviewScreen}
                    />
                    <Stack.Screen name="Receipt" component={ReceiptScreen} />
                    <Stack.Screen
                      name="PrintSuccess"
                      component={PrintSuccessScreen}
                    />
                    <Stack.Screen name="Waiters" component={WaitersScreen} />
                    <Stack.Screen
                      name="AddWaiter"
                      component={AddWaiterScreen}
                    />
                    <Stack.Screen name="DishForm" component={DishFormScreen} />
                    <Stack.Screen
                      name="ExpenseForm"
                      component={ExpenseFormScreen}
                    />
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
                    <Stack.Screen
                      name="Subscription"
                      component={SubscriptionScreen}
                    />
                    <Stack.Screen name="Purchase" component={PurchaseScreen} />
                  </>
                )}
              </Stack.Group>
            )}
          </Stack.Navigator>
          <ConfirmationSheet
            visible={!!session && isExpired && !isPurchasing}
            title={t('common.letSKeepYourRestaurantFlowing')}
            description={
              canPurchase
                ? t('api.trialExpired')
                : t('common.yourRestaurantSFreeTrialHasEndedAskThe')
            }
            icon="crown"
            confirmLabel={
              canPurchase ? t('api.subscriptionAccess') : t('common.logOut')
            }
            cancelLabel={canPurchase ? t('common.logOut') : undefined}
            isBlocking
            onConfirm={
              canPurchase ? () => navigationRef.navigate('Purchase') : signOut
            }
            onCancel={signOut}
          />
        </NavigationContainer>
      </LedgerProvider>
    </MenuProvider>
  );
}
