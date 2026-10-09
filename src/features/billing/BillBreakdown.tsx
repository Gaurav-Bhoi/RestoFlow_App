import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type { OrderItems } from '../restaurant/types';
import { calculateOrderTotal, orderLines } from '../orders/orderCalculations';

export function BillBreakdown({ items }: { items: OrderItems }) {
  const total = calculateOrderTotal(items);
  return (
    <>
      <View style={styles.columns}>
        <AppText muted style={styles.itemHeader}>
          Item
        </AppText>
        <AppText muted style={styles.qtyHeader}>
          Qty
        </AppText>
        <AppText muted style={styles.priceHeader}>
          Price
        </AppText>
        <AppText muted style={styles.amountHeader}>
          Amount
        </AppText>
      </View>
      {orderLines(items).map(line => (
        <View style={styles.billRow} key={line.dish.id}>
          <AppText style={styles.item}>{line.dish.name}</AppText>
          <AppText style={styles.quantity}>{line.quantity}</AppText>
          <AppText style={styles.price}>
            {formatCurrency(line.dish.price)}
          </AppText>
          <AppText style={styles.amount}>{formatCurrency(line.amount)}</AppText>
        </View>
      ))}
      <View style={styles.totals}>
        <View style={layout.row}>
          <AppText muted variant="small">
            Subtotal
          </AppText>
          <AppText muted variant="small">
            {formatCurrency(total)}
          </AppText>
        </View>
        <View style={[layout.row, styles.tax]}>
          <AppText muted variant="small">
            Taxes & charges
          </AppText>
          <AppText muted variant="small">
            ₹0
          </AppText>
        </View>
        <View style={[layout.row, styles.grand]}>
          <AppText style={styles.grandLabel}>Total bill</AppText>
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
