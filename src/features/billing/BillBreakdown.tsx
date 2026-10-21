import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type { ApiBill } from '../../api/types';

export function BillBreakdown({ bill }: { bill: ApiBill }) {
  const { t } = useTranslation('translation', { lng: 'en' });
  const total = bill.total;
  return (
    <>
      <View style={styles.columns}>
        <AppText muted style={styles.itemHeader}>
          {t('billing.item')}
        </AppText>
        <AppText muted style={styles.qtyHeader}>
          {t('billing.qty')}
        </AppText>
        <AppText muted style={styles.priceHeader}>
          {t('billing.price')}
        </AppText>
        <AppText muted style={styles.amountHeader}>
          {t('billing.amount')}
        </AppText>
      </View>
      {bill.items.map((line, index) => (
        <View style={styles.billRow} key={index}>
          <AppText style={styles.item}>{line.name}</AppText>
          <AppText style={styles.quantity}>{line.quantity}</AppText>
          <AppText style={styles.price}>
            {formatCurrency(line.unitPrice)}
          </AppText>
          <AppText style={styles.amount}>
            {formatCurrency(line.lineTotal)}
          </AppText>
        </View>
      ))}
      <View style={styles.totals}>
        <View style={layout.row}>
          <AppText muted variant="small">
            {t('billing.subtotal')}
          </AppText>
          <AppText muted variant="small">
            {formatCurrency(bill.subtotal)}
          </AppText>
        </View>
        <View style={[layout.row, styles.grand]}>
          <AppText style={styles.grandLabel}>{t('billing.totalBill')}</AppText>
          <AppText style={styles.grandAmount}>{formatCurrency(total)}</AppText>
        </View>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  columns: { flexDirection: 'row', paddingBottom: 14 },
  itemHeader: { flex: 1, fontSize: 10 },
  qtyHeader: { width: 30, textAlign: 'right', fontSize: 10 },
  priceHeader: { width: 55, textAlign: 'right', fontSize: 10 },
  amountHeader: { width: 65, textAlign: 'right', fontSize: 10 },
  billRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    alignItems: 'center',
  },
  item: { flex: 1, fontSize: 12, fontWeight: '700' },
  quantity: { width: 30, textAlign: 'right', fontSize: 12 },
  price: { width: 55, textAlign: 'right', fontSize: 12 },
  amount: { width: 65, textAlign: 'right', fontSize: 12 },
  totals: { paddingTop: 20 },
  tax: { marginTop: 12 },
  grand: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 18,
    marginTop: 19,
  },
  grandLabel: { fontSize: 17 },
  grandAmount: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.forest,
  },
});
