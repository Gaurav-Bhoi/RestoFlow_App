import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { colors, layout } from '../../theme/tokens';
import { formatDate } from '../../utils/date';
import { useCustomerBill } from './useCustomerBill';
import { BillBreakdown } from './BillBreakdown';

export function ReceiptScreen({
  route,
  navigation,
}: RootScreenProps<'Receipt'>) {
  const { t } = useTranslation();
  const bill = useCustomerBill(route.params.tableId, route.params.customerId);
  const handlePrint = async () => {
    if (await bill.printReceipt()) {
      navigation.replace('PrintSuccess', route.params);
    }
  };
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
          description={t('billing.thisOrderIsNoLongerActive')}
        />
      </Screen>
    );
  }
  return (
    <Screen
      header={
        <AppHeader
          title={t('billing.readyToPrint')}
          subtitle={t('billing.receiptPreview')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <View style={layout.row}>
          <AppButton
            variant="secondary"
            onPress={navigation.goBack}
            style={styles.cancel}
          >
            {t('billing.cancel')}
          </AppButton>
          <AppButton
            icon="print"
            disabled={bill.isPrinting}
            onPress={handlePrint}
            style={styles.print}
          >
            {bill.isPrinting ? t('billing.opening') : t('billing.printBill')}
          </AppButton>
        </View>
      }
    >
      <View style={styles.receipt}>
        <View style={styles.heading}>
          <AppText variant="section" style={styles.title}>
            {bill.restaurant.name}
          </AppText>
          <AppText muted variant="helper">
            {t('billing.tableValueValue', {
              lng: 'en',
              value0: bill.tableNumber,
              value1: bill.order.name,
            })}
          </AppText>
          <AppText muted variant="helper">
            {formatDate(bill.issuedAt)} ·{' '}
            {bill.issuedAt.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </AppText>
        </View>
        <BillBreakdown bill={bill.bill} />
        <AppText muted style={styles.thanks}>
          {t('billing.thankYouForDiningWithUsWeHopeTo', { lng: 'en' })}
        </AppText>
        <View style={styles.perforations}>
          {Array.from({ length: 32 }, (_, index) => (
            <View key={index} style={styles.perforation} />
          ))}
        </View>
      </View>
      <AppText muted variant="small" style={styles.caption}>
        {t('billing.printsThroughYourDeviceSPrintService')}
      </AppText>
    </Screen>
  );
}
const styles = StyleSheet.create({
  cancel: { width: 115 },
  print: { flex: 1 },
  receipt: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 7,
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 25,
  },
  heading: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: '#cbd5cb',
    paddingBottom: 18,
    marginBottom: 22,
    gap: 4,
  },
  title: { fontSize: 19, textAlign: 'center' },
  thanks: { fontSize: 11, textAlign: 'center', marginTop: 28 },
  caption: { textAlign: 'center' },
  perforations: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    overflow: 'hidden',
  },
  perforation: {
    width: 6,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.paper,
  },
});
