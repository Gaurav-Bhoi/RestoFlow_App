import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { Screen } from '../../components/Screen';
import { colors, layout } from '../../theme/tokens';
import { billDate, billTime } from './billExport';
import { ReadOnlyBill } from './ReadOnlyBill';
import { useReceipt } from './useReceipt';

export function BillOverviewScreen({
  route,
  navigation,
}: RootScreenProps<'BillOverview'>) {
  const { t, i18n } = useTranslation();
  const { bill, loading, error, load } = useReceipt(
    route.params.tableId,
    route.params.customerId,
    route.params.draft,
  );
  const time = bill ? billTime(bill, i18n.language) : '';
  return (
    <Screen
      header={
        <AppHeader
          wrap
          title={t('billing.customerBill')}
          subtitle={t('billing.reviewBeforePrinting')}
          onBack={navigation.goBack}
        />
      }
      footer={
        bill ? (
          <AppButton
            wrapLabel
            icon="print"
            onPress={() =>
              navigation.navigate('Receipt', {
                ...route.params,
                presentation: 'table',
              })
            }
          >
            {t('billing.previewPrint')}
          </AppButton>
        ) : undefined
      }
    >
      {loading ? (
        <AppText>{t('api.loadingBill')}</AppText>
      ) : !bill ? (
        <EmptyState
          title={t('api.loadBillFailed')}
          description={error}
          action={{
            label: t('api.retry'),
            onPress: () => {
              load();
            },
          }}
        />
      ) : (
        <>
          <View style={styles.hero}>
            <View style={styles.watermark}>
              <Icon name="cutlery" size={92} color={colors.white} />
            </View>
            <AppText style={styles.restaurant}>{bill.restaurantName}</AppText>
            <AppText style={styles.customer}>{bill.customerName}</AppText>
            <AppText style={styles.meta}>
              {bill.table.name} ·{' '}
              {t('orders.valueItems', { value0: bill.itemCount })}
            </AppText>
            <View style={[layout.row, styles.date]}>
              <AppText style={styles.meta}>
                {billDate(bill, i18n.language)}
              </AppText>
              <AppText style={styles.meta}>{time}</AppText>
            </View>
          </View>
          <ReadOnlyBill bill={bill} />
          <View style={styles.notice}>
            <Notice>
              {t('billing.thisBillIncludesOnlyValueSOrder', {
                value0: bill.customerName,
              })}
            </Notice>
          </View>
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.forest,
    borderRadius: 28,
    minHeight: 160.25,
    padding: 22,
    marginBottom: 24,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: 16,
    bottom: 10,
    opacity: 0.2,
    transform: [{ rotate: '-15deg' }],
  },
  restaurant: { color: '#c5d7cc', fontSize: 10, lineHeight: 15 },
  customer: { fontSize: 25, lineHeight: 35, color: colors.white, marginTop: 6 },
  meta: { color: '#dae6dc', fontSize: 12, lineHeight: 18 },
  date: { marginTop: 18, gap: 12 },
  notice: { marginTop: 30 },
});
