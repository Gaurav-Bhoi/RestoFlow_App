import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { colors, radius } from '../../theme/tokens';
import { filterExpenses, totalExpenses } from './expenseCalculations';
import { expenseDate, expenseMoney } from './expenseFormatting';
import type { Expense, ExpenseFilters, ExpensePeriod } from './types';

export function LedgerSummary({
  expenses,
  visible,
  filters,
  now,
}: {
  expenses: Expense[];
  visible: Expense[];
  filters: ExpenseFilters;
  now: Date;
}) {
  const { t, i18n } = useTranslation();
  let period = t(`ledger.options.${filters.period}`);
  if (filters.period === 'thisMonth')
    period = now.toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    });
  if (filters.period === 'today' || filters.period === 'yesterday') {
    const date = new Date(now);
    if (filters.period === 'yesterday') date.setDate(date.getDate() - 1);
    period = expenseDate(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(date.getDate()).padStart(2, '0')}`,
      i18n.language,
    );
  }
  if (filters.period === 'custom')
    period = `${expenseDate(filters.from, i18n.language)} – ${expenseDate(
      filters.to,
      i18n.language,
    )}`;
  const totals = (['today', 'thisWeek', 'thisMonth'] as const).map(value => ({
    period: value,
    total: totalExpenses(
      filterExpenses(
        expenses,
        { ...filters, period: value as ExpensePeriod },
        '',
        now,
      ),
    ),
  }));
  return (
    <View style={styles.card}>
      <AppText variant="helper" muted style={styles.label}>
        {t('ledger.totalExpenses')} · {period}
      </AppText>
      <AppText style={styles.total}>
        {expenseMoney(totalExpenses(visible))}
      </AppText>
      <View style={styles.totals}>
        {totals.map(value => (
          <View key={value.period} style={styles.column}>
            <AppText muted style={styles.caption}>
              {t(`ledger.options.${value.period}`)}
            </AppText>
            <AppText style={styles.amount}>{expenseMoney(value.total)}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.sage,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 126,
  },
  label: { lineHeight: 15.4 },
  total: { fontSize: 31, lineHeight: 43.4, color: colors.forest, marginTop: 4 },
  totals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  column: { flex: 1 },
  caption: { fontSize: 10, lineHeight: 14 },
  amount: {
    fontSize: 14,
    lineHeight: 19.6,
    color: colors.forest,
    flexShrink: 1,
  },
});
