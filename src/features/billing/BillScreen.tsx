import { useTranslation } from 'react-i18next';
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
import { useCustomerBill } from './useCustomerBill';
import { BillBreakdown } from './BillBreakdown';

export function BillScreen({ navigation, route }: RootScreenProps<'Bill'>) {
  const { t } = useTranslation();
  const bill = useCustomerBill(route.params.tableId, route.params.customerId);
  if (bill.loading)
    return (
      <Screen>
        <AppText>{t('api.loadingBill')}</AppText>
      </Screen>
    );
  if (bill.error)
    return (
      <Screen>
        <EmptyState
          title={t('api.loadBillFailed')}
          description={bill.error}
          action={{
            label: t('api.retry'),
            onPress: () => {
              bill.retry();
            },
          }}
        />
      </Screen>
    );
  if (!bill.order || !bill.bill) {
    return (
      <Screen>
        <EmptyState
          title={t('billing.visitCompleted')}
          description={t('billing.thisCustomerSOrderIsNoLongerActive')}
          action={{
            label: t('billing.backToFloor'),
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
          title={t('billing.customerBill')}
          subtitle={t('billing.reviewBeforePrinting')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton
          icon="print"
          onPress={() => navigation.navigate('Receipt', route.params)}
        >
          {t('billing.previewPrint')}
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
          {t('billing.tableValueValueItems', {
            value0: bill.tableNumber,
            value1: bill.order.items.reduce(
              (count, item) => count + item.quantity,
              0,
            ),
          })}
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
      <BillBreakdown bill={bill.bill} />
      <View style={styles.notice}>
        <Notice>
          {t('billing.thisBillIncludesOnlyValueSOrder', {
            value0: bill.order.name,
          })}
        </Notice>
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
