import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useLedger } from './LedgerProvider';
import {
  ExpenseSelect,
  ExpenseChoiceSheet,
  expenseControlStyles as controls,
} from './ExpenseControls';
import { ExpenseDateSheet } from './ExpenseDateSheet';
import { defaultExpenseFilters, filterValidation } from './expenseCalculations';
import { expenseDate } from './expenseFormatting';
import { buildExpenseReport } from './expenseReport';
import { ledgerError, ledgerFiles } from './ledgerFiles';
import { expensePeriods, type ExpenseFilters } from './types';

export function ExpenseReportScreen({
  navigation,
}: RootScreenProps<'ExpenseReport'>) {
  const { t, i18n } = useTranslation();
  const { restaurant } = useRestaurant();
  const ledger = useLedger();
  const [filters, setFilters] = useState<ExpenseFilters>(defaultExpenseFilters);
  const [sheet, setSheet] = useState<
    'period' | 'category' | 'from' | 'to' | null
  >(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const { contentWidth, fontScale } = useResponsiveLayout();
  const stack = contentWidth < 310 || fontScale >= 1.3;
  const close = () => setSheet(null);
  const update = <K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K],
  ) => {
    setFilters(current => ({ ...current, [key]: value }));
    setError('');
    close();
  };
  async function generate() {
    if (pending.current) return;
    const invalid = filterValidation(filters);
    if (invalid || ledger.error) {
      setError(invalid || ledger.error);
      return;
    }
    pending.current = true;
    setGenerating(true);
    setError('');
    try {
      const document = buildExpenseReport(
        ledger.expenses,
        filters,
        restaurant.name,
        new Date(),
        t,
        i18n.language,
      );
      const uri = await ledgerFiles.createPdf(document);
      navigation.navigate('ExpenseReportPreview', { document, uri });
    } catch (cause) {
      setError(ledgerError(cause, 'ledger.reportFailed'));
    } finally {
      pending.current = false;
      setGenerating(false);
    }
  }
  return (
    <>
      <Screen
        header={
          <AppHeader
            title={t('ledger.exportReport')}
            subtitle={t('ledger.reportSubtitle')}
            onBack={navigation.goBack}
            backDisabled={generating}
          />
        }
        footer={
          <>
            {!!error && (
              <AppText accessibilityRole="alert" style={controls.error}>
                {t(error)}
              </AppText>
            )}
            <AppButton
              loading={generating}
              onPress={() => {
                generate();
              }}
            >
              {t(generating ? 'ledger.generating' : 'ledger.generatePdf')}
            </AppButton>
          </>
        }
      >
        <View style={styles.illustration}>
          <Icon name="file" size={44} />
        </View>
        <View style={styles.fields}>
          <ExpenseSelect
            label={t('ledger.reportPeriod')}
            value={t(`ledger.options.${filters.period}`)}
            onPress={() => setSheet('period')}
            disabled={generating}
          />
          {filters.period === 'custom' && (
            <View style={[controls.row, stack && controls.stacked]}>
              {(['from', 'to'] as const).map(key => (
                <View key={key} style={controls.field}>
                  <ExpenseSelect
                    label={t(`ledger.${key}Date`)}
                    value={expenseDate(filters[key], i18n.language)}
                    icon="calendar"
                    onPress={() => setSheet(key)}
                    disabled={generating}
                  />
                </View>
              ))}
            </View>
          )}
          <ExpenseSelect
            label={t('ledger.category')}
            value={t(
              filters.category === 'all'
                ? 'ledger.allExpenses'
                : `ledger.options.${filters.category}`,
            )}
            onPress={() => setSheet('category')}
            disabled={generating}
          />
          <ExpenseSelect
            label={t('ledger.exportFormat')}
            value="PDF"
            icon="file"
          />
          <AppText muted variant="small">
            {t('ledger.reportHint')}
          </AppText>
        </View>
      </Screen>
      <ExpenseChoiceSheet
        title={t('ledger.reportPeriod')}
        options={expensePeriods.filter(value => value !== 'yesterday')}
        selected={filters.period}
        visible={sheet === 'period'}
        onClose={close}
        onSelect={value => update('period', value)}
      />
      <ExpenseChoiceSheet
        title={t('ledger.reportCategory')}
        options={['all', 'inventory', 'miscellaneous'] as const}
        selected={filters.category}
        visible={sheet === 'category'}
        onClose={close}
        onSelect={value => update('category', value)}
      />
      {(sheet === 'from' || sheet === 'to') && (
        <ExpenseDateSheet
          title={t(`ledger.${sheet}Date`)}
          value={filters[sheet]}
          onClose={close}
          onSelect={value => update(sheet, value)}
        />
      )}
    </>
  );
}
const styles = StyleSheet.create({
  illustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  fields: { marginTop: 42, gap: 8 },
});
