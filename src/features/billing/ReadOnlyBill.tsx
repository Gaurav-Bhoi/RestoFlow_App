import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomerBill } from '../../api/billing';
import { AppText } from '../../components/AppText';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';

/** The original four-column bill and receipt share the same price snapshots. */
export function ReadOnlyBill({ bill }: { bill: CustomerBill }) {
  const { t } = useTranslation();
  const { fontScale, contentWidth } = useResponsiveLayout();
  const compact =
    fontScale > 1.15 ||
    contentWidth < 330 ||
    bill.items.some(line => formatCurrency(line.lineTotal).length > 7);
  return (
    <>
      {!compact && (
        <View style={styles.row}>
          {['item', 'qty', 'price', 'amount'].map((key, index) => (
            <AppText key={key} muted style={[styles.label, columns[index]]}>
              {t(`billing.${key}`)}
            </AppText>
          ))}
        </View>
      )}
      {bill.items.map(line => (
        <View key={line.id} style={styles.line}>
          {compact ? (
            <>
              <View style={layout.row}>
                <AppText style={styles.name}>{line.name}</AppText>
                <AppText>{formatCurrency(line.lineTotal)}</AppText>
              </View>
              <AppText muted variant="small">
                {line.quantity} × {formatCurrency(line.unitPrice)}
              </AppText>
            </>
          ) : (
            <View style={styles.row}>
              {[
                line.name,
                line.quantity,
                formatCurrency(line.unitPrice),
                formatCurrency(line.lineTotal),
              ].map((value, index) => (
                <AppText key={index} style={[styles.value, columns[index]]}>
                  {value}
                </AppText>
              ))}
            </View>
          )}
          {!!line.note && (
            <AppText muted variant="helper">
              {line.note}
            </AppText>
          )}
        </View>
      ))}
      <View style={styles.subtotals}>
        <View style={layout.row}>
          <AppText muted variant="small">
            {t('billing.subtotal')}
          </AppText>
          <AppText muted variant="small">
            {formatCurrency(bill.subtotal)}
          </AppText>
        </View>
        <View style={[layout.row, styles.tax]}>
          <AppText muted variant="small">
            {t('billing.taxesCharges')}
          </AppText>
          <AppText muted variant="small">
            {formatCurrency(bill.taxesAndCharges)}
          </AppText>
        </View>
      </View>
      <View style={[layout.row, styles.grand]}>
        <AppText style={styles.totalLabel}>{t('billing.totalBill')}</AppText>
        <AppText style={styles.total}>{formatCurrency(bill.total)}</AppText>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 29 },
  label: { fontSize: 10, lineHeight: 15 },
  name: { flex: 1, minWidth: 0 },
  qty: { width: 30, textAlign: 'right' },
  price: { width: 46, textAlign: 'right' },
  amount: { width: 57, textAlign: 'right' },
  line: {
    minHeight: 45,
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  value: { fontSize: 12, lineHeight: 18 },
  subtotals: {
    paddingTop: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tax: { marginTop: 12 },
  grand: { marginTop: 22, gap: 12 },
  totalLabel: { fontSize: 17, lineHeight: 25.5, flex: 1 },
  total: { fontSize: 30, lineHeight: 45, color: colors.forest, flexShrink: 1 },
});
const columns = [styles.name, styles.qty, styles.price, styles.amount];
