import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSurface } from '../../components/ModalSurface';
import { BottomSheetContent } from '../../components/BottomSheet';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { formatDate } from '../../utils/date';
import {
  defaultExpenseFilters,
  filterValidation,
  localDate,
} from './expenseCalculations';
import {
  ExpenseSelect,
  ExpenseChoiceSheet,
  expenseControlStyles as controls,
} from './ExpenseControls';
import { ExpenseDateSheet } from './ExpenseDateSheet';
import { expensePeriods, paymentMethods, type ExpenseFilters } from './types';

type FilterPicker = 'period' | 'category' | 'payment' | 'from' | 'to';
export function ExpenseFiltersSheet({
  filters,
  onApply,
  onClose,
}: {
  filters: ExpenseFilters;
  onApply: (value: ExpenseFilters) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(filters);
  const [picker, setPicker] = useState<FilterPicker | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { contentWidth, fontScale } = useResponsiveLayout();
  const stack = contentWidth < 310 || fontScale >= 1.3;
  const update = <K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K],
  ) => setDraft(current => ({ ...current, [key]: value }));
  const invalid = filterValidation(draft);
  const closePicker = () => setPicker(null);
  function apply() {
    setSubmitted(true);
    if (!invalid) onApply(draft);
  }
  return (
    <ModalSurface visible onClose={picker ? closePicker : onClose}>
      <BottomSheetContent
        title={t('ledger.filterExpenses')}
        onClose={onClose}
        tall
        footer={
          <View style={controls.row}>
            <AppButton
              variant="ghost"
              onPress={() => {
                setDraft(defaultExpenseFilters());
                setSubmitted(false);
              }}
              style={styles.reset}
            >
              {t('ledger.reset')}
            </AppButton>
            <AppButton onPress={apply} style={styles.apply}>
              {t('ledger.applyFilters')}
            </AppButton>
          </View>
        }
      >
        <ExpenseSelect
          label={t('ledger.dateRange')}
          value={t(`ledger.options.${draft.period}`)}
          onPress={() => setPicker('period')}
        />
        {draft.period === 'custom' && (
          <View style={[controls.row, stack && controls.stacked]}>
            {(['from', 'to'] as const).map(key => (
              <View key={key} style={controls.field}>
                <ExpenseSelect
                  label={t(`ledger.${key}Date`)}
                  value={formatDate(localDate(draft[key]))}
                  icon="calendar"
                  onPress={() => setPicker(key)}
                />
              </View>
            ))}
          </View>
        )}
        <ExpenseSelect
          label={t('ledger.expenseCategory')}
          value={t(`ledger.options.${draft.category}`)}
          onPress={() => setPicker('category')}
        />
        <ExpenseSelect
          label={t('ledger.paymentMethod')}
          value={t(`ledger.options.${draft.payment}`)}
          onPress={() => setPicker('payment')}
        />
        <View style={[controls.row, stack && controls.stacked]}>
          {(['min', 'max'] as const).map(key => (
            <View key={key} style={controls.field}>
              <AppInput
                label={t(`ledger.${key}Amount`)}
                labelStyle={controls.inputLabel}
                keyboardType="decimal-pad"
                placeholder="₹0"
                value={draft[key] ? `₹${draft[key]}` : ''}
                maxLength={15}
                onChangeText={value =>
                  update(key, value.replace(/[₹,\s]/g, ''))
                }
              />
            </View>
          ))}
        </View>
        {submitted && invalid && (
          <AppText accessibilityRole="alert" style={controls.error}>
            {t(invalid)}
          </AppText>
        )}
        <AppText variant="helper" muted>
          {t('ledger.totalsHint')}
        </AppText>
      </BottomSheetContent>
      {picker && (
        <View style={styles.overlay}>
          <Pressable
            accessible={false}
            onPress={closePicker}
            style={StyleSheet.absoluteFill}
          />
          {picker === 'period' && (
            <ExpenseChoiceSheet
              embedded
              visible
              title={t('ledger.dateRange')}
              options={expensePeriods}
              selected={draft.period}
              onClose={closePicker}
              onSelect={value => {
                update('period', value);
                closePicker();
              }}
            />
          )}
          {picker === 'category' && (
            <ExpenseChoiceSheet
              embedded
              visible
              title={t('ledger.expenseCategory')}
              options={['all', 'inventory', 'miscellaneous'] as const}
              selected={draft.category}
              onClose={closePicker}
              onSelect={value => {
                update('category', value);
                closePicker();
              }}
            />
          )}
          {picker === 'payment' && (
            <ExpenseChoiceSheet
              embedded
              visible
              title={t('ledger.paymentMethod')}
              options={['all', ...paymentMethods]}
              selected={draft.payment}
              onClose={closePicker}
              onSelect={value => {
                update('payment', value);
                closePicker();
              }}
            />
          )}
          {(picker === 'from' || picker === 'to') && (
            <ExpenseDateSheet
              embedded
              key={picker}
              title={t(`ledger.${picker}Date`)}
              value={draft[picker]}
              onClose={closePicker}
              onSelect={value => {
                update(picker, value);
                closePicker();
              }}
            />
          )}
        </View>
      )}
    </ModalSurface>
  );
}
const styles = StyleSheet.create({
  reset: { flex: 1 },
  apply: { flex: 2 },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#22352d55',
  },
});
