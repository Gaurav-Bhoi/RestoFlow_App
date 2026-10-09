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
          title="Table unavailable"
          description="This table is no longer on your floor."
          action={{
            label: 'Back to floor',
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
          title={`Table ${table.id}`}
          subtitle={`${table.customers.length} guests · ${
            isOwner
              ? 'Select a customer to bill'
              : 'Each guest has a separate order'
          }`}
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
          {isOwner ? 'Back to floor' : 'Add customer'}
        </AppButton>
      }
    >
      {table.customers.length ? (
        <>
          <View style={[layout.section, styles.section]}>
            <AppText variant="section">
              {isOwner ? 'Who’s checking out?' : 'Your guests'}
            </AppText>
            <Badge warm={isOwner}>{isOwner ? 'Billing' : 'Occupied'}</Badge>
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
          title="Ready for your guests"
          description={
            isOwner
              ? 'Your waiter can add customers and take their orders here.'
              : 'Start a new customer order. Their dishes and bill stay separate.'
          }
          icon="people"
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({ section: { marginTop: 5 } });
