import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BillLine } from '../../api/billing';
import { AppText } from '../../components/AppText';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { BillIconButton } from './BillControls';
import type { BillField } from './BillItemEditor';

export function EditableBillItems({
  items,
  disabled,
  onEdit,
  onRemove,
}: {
  items: BillLine[];
  disabled: boolean;
  onEdit: (id: string, field: BillField) => void;
  onRemove: (line: BillLine) => void;
}) {
  const { t } = useTranslation();
  const { contentWidth, fontScale } = useResponsiveLayout();
  const compact =
    contentWidth < 330 ||
    fontScale > 1.15 ||
    items.some(
      line =>
        formatCurrency(line.lineTotal).length > 7 ||
        formatCurrency(line.unitPrice).length > 7,
    );
  function cell(line: BillLine, field: BillField, index: number) {
    return (
      <Pressable
        key={field}
        accessibilityRole="button"
        accessibilityLabel={t(`billing.editLabel_${field}`, {
          name: line.name,
          value: line[field],
        })}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onEdit(line.id, field)}
        style={[styles.cell, compact ? styles.flexible : columns[index]]}
      >
        {compact && (
          <AppText muted style={styles.label}>
            {t(`billing.${['item', 'qty', 'price'][index]}`)}
          </AppText>
        )}
        <AppText style={styles.value}>
          {field === 'unitPrice' ? formatCurrency(line.unitPrice) : line[field]}
        </AppText>
      </Pressable>
    );
  }
  return (
    <>
      {!compact && (
        <View style={styles.columns}>
          {['item', 'qty', 'price', 'amount'].map((key, index) => (
            <AppText key={key} muted style={[styles.label, columns[index]]}>
              {t(`billing.${key}`)}
            </AppText>
          ))}
          <View style={styles.deleteColumn} />
        </View>
      )}
      {items.map(line => (
        <View key={line.id} style={styles.line}>
          {compact ? (
            <>
              {cell(line, 'name', 0)}
              <View style={styles.row}>
                {cell(line, 'quantity', 1)}
                {cell(line, 'unitPrice', 2)}
              </View>
              <View style={styles.row}>
                <AppText muted variant="small" style={styles.flexible}>
                  {t('billing.amount')}
                </AppText>
                <AppText style={styles.value}>
                  {formatCurrency(line.lineTotal)}
                </AppText>
                <BillIconButton
                  plain
                  icon="trash"
                  label={t('billing.removeItemLabel', { name: line.name })}
                  disabled={disabled}
                  onPress={() => onRemove(line)}
                />
              </View>
            </>
          ) : (
            <View style={styles.row}>
              {(['name', 'quantity', 'unitPrice'] as const).map(
                (field, index) => cell(line, field, index),
              )}
              <AppText style={[styles.value, styles.amount]}>
                {formatCurrency(line.lineTotal)}
              </AppText>
              <BillIconButton
                plain
                icon="trash"
                label={t('billing.removeItemLabel', { name: line.name })}
                disabled={disabled}
                onPress={() => onRemove(line)}
              />
            </View>
          )}
          {!!line.note && (
            <AppText muted variant="helper" style={styles.note}>
              {line.note}
            </AppText>
          )}
        </View>
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    minHeight: 20,
  },
  label: { fontSize: 10, lineHeight: 14 },
  name: { flex: 1, minWidth: 50 },
  quantity: { width: 43 },
  price: { width: 62 },
  amount: { width: 43 },
  deleteColumn: { width: 44 },
  flexible: { flex: 1, minWidth: 0 },
  line: {
    paddingBottom: 7,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cell: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  value: { fontSize: 12, lineHeight: 16.8, color: colors.forest },
  note: { marginTop: 4 },
});
const columns = [styles.name, styles.quantity, styles.price, styles.amount];
