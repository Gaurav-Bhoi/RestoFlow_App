import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { layout } from '../../theme/tokens';
import { useSession } from '../auth/SessionProvider';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { CustomerCard } from './CustomerCard';

export function CustomersScreen({
  navigation,
  route,
}: RootScreenProps<'Customers'>) {
  const { t } = useTranslation();
  const { restaurant } = useRestaurant();
  const { session } = useSession();
  const table = restaurant.tables.find(
    item => item.id === route.params.tableId,
  );
  const isOwner = session?.role === 'owner';
  if (!table) {
    return (
      <Screen>
        <EmptyState
          title={t('orders.tableUnavailable')}
          description={t('orders.thisTableIsNoLongerOnYourFloor')}
          action={{
            label: t('orders.backToFloor'),
            onPress: () => navigation.popToTop(),
          }}
        />
      </Screen>
    );
  }
  return (
    <Screen
      header={
        <AppHeader
          title={t('orders.tableValue', { value0: table.number })}
          subtitle={t(isOwner ? 'orders.guestsOwner' : 'orders.guestsWaiter', {
            count: table.customers.length,
          })}
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton
          variant={isOwner ? 'secondary' : 'primary'}
          icon={isOwner ? undefined : 'plus'}
          onPress={
            isOwner
              ? () => navigation.popToTop()
              : () => navigation.navigate('Order', { tableId: table.id })
          }
        >
          {isOwner ? t('orders.backToFloor') : t('orders.addCustomer')}
        </AppButton>
      }
    >
      {table.customers.length ? (
        <>
          <View style={[layout.section, styles.section]}>
            <AppText variant="section">
              {isOwner ? t('orders.whoSCheckingOut') : t('orders.yourGuests')}
            </AppText>
            <Badge warm={isOwner}>
              {isOwner ? t('orders.billing') : t('orders.occupied')}
            </Badge>
          </View>
          <View style={layout.stack}>
            {table.customers.map(order => (
              <CustomerCard
                order={order}
                key={order.id}
                isOwner={isOwner}
                onPress={() =>
                  navigation.navigate(isOwner ? 'Bill' : 'Order', {
                    tableId: table.id,
                    customerId: order.id,
                  })
                }
              />
            ))}
          </View>
        </>
      ) : (
        <EmptyState
          title={t('orders.readyForYourGuests')}
          description={
            isOwner
              ? t('orders.yourWaiterCanAddCustomersAndTakeTheirOrders')
              : t('orders.startANewCustomerOrderTheirDishesAndBill')
          }
          icon="people"
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({ section: { marginTop: 5 } });
