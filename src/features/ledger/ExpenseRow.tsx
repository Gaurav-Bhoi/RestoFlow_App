import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { expenseDate, expenseMoney, expenseTime } from './expenseFormatting';
import type { Expense } from './types';

export function ExpenseRow({
  expense,
  onPress,
}: {
  expense: Expense;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const inventory = expense.category === 'inventory';
  const category = [
    t(`ledger.options.${expense.category}`),
    expense.subcategory && t(`ledger.options.${expense.subcategory}`),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expense.name}, ${expenseMoney(
        expense.amountPaise,
      )}, ${category}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, !inventory && styles.miscIcon]}>
        <Icon
          name={inventory ? 'package' : 'wallet'}
          size={18}
          color={inventory ? colors.forest : colors.terracotta}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.head}>
          <AppText style={styles.name}>{expense.name}</AppText>
          <AppText style={styles.amount}>
            {expenseMoney(expense.amountPaise)}
          </AppText>
        </View>
        <AppText style={styles.detail} muted>
          {category}
        </AppText>
        <AppText style={styles.detail} muted>
          {expenseDate(expense.date, i18n.language)} ·{' '}
          {expenseTime(expense.time, i18n.language)}
        </AppText>
        {!!expense.notes && (
          <AppText style={styles.detail} muted numberOfLines={2}>
            {expense.notes}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 94,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 18,
  },
  pressed: { backgroundColor: colors.sage },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.sage,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miscIcon: { backgroundColor: colors.peach },
  content: { flex: 1, minWidth: 0, gap: 3 },
  head: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  name: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '55%',
    fontSize: 14,
    lineHeight: 19.6,
  },
  amount: {
    color: colors.forest,
    fontSize: 14,
    lineHeight: 19.6,
    flexShrink: 1,
  },
  detail: { fontSize: 10, lineHeight: 14 },
});
