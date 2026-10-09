import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { colors, layout } from '../../theme/tokens';
import { formatDate } from '../../utils/date';
import { countOrderItems } from '../orders/orderCalculations';
import { useCustomerBill } from './useCustomerBill';
import { BillBreakdown } from './BillBreakdown';

export function BillScreen({ navigation, route }: RootScreenProps<'Bill'>) {
  const bill = useCustomerBill(route.params.tableId, route.params.customerId);
  if (!bill.order) {
    return (
      <Screen>
        <EmptyState
          title="Visit completed"
          description="This customer’s order is no longer active."
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
          title="Customer bill"
          subtitle="Review before printing"
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton
          icon="print"
          onPress={() => navigation.navigate('Receipt', route.params)}
        >
          Preview & print
        </AppButton>
      }
    >
      <View style={styles.intro}>
        <View style={styles.watermark}>
          <Icon name="cutlery" size={75} color={colors.white} />
        </View>
        <AppText style={styles.eyebrow}>
          {bill.restaurant.name.toUpperCase()}
        </AppText>
        <AppText style={styles.name}>{bill.order.name}</AppText>
        <AppText style={styles.details}>
          Table {route.params.tableId} · {countOrderItems(bill.order.items)}{' '}
          items
        </AppText>
        <View style={[layout.row, styles.dateRow]}>
          <AppText style={styles.date}>{formatDate(bill.issuedAt)}</AppText>
          <AppText style={styles.date}>
            {bill.issuedAt.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </AppText>
        </View>
      </View>
      <BillBreakdown items={bill.order.items} />
      <View style={styles.notice}>
        <Notice>{`This bill includes only ${bill.order.name}’s order.`}</Notice>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  intro: {
    backgroundColor: colors.forest,
    borderRadius: 28,
    paddingVertical: 23,
    paddingHorizontal: 22,
    marginBottom: 25,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    opacity: 0.2,
    transform: [{ rotate: '-15deg' }],
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#c5d7cc',
  },
  name: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
    color: colors.white,
    marginTop: 6,
    marginBottom: 12,
  },
  details: { fontSize: 12, color: '#dae6dc' },
  dateRow: { marginTop: 18 },
  date: { fontSize: 11, color: '#dae6dc' },
  notice: { marginTop: 30 },
});
