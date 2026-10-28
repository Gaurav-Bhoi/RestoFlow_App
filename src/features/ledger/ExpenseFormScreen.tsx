import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { BottomSheet } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, contentWidths } from '../../theme/tokens';
import { useLedger } from './LedgerProvider';
import { useExpenseForm, validateExpenseDraft } from './useExpenseForm';
import {
  ExpenseSelect,
  ExpenseChoiceSheet,
  expenseControlStyles as controls,
} from './ExpenseControls';
import { ExpenseDateSheet } from './ExpenseDateSheet';
import { ExpenseTimeSheet } from './ExpenseTimeSheet';
import { expenseDate, expenseTime } from './expenseFormatting';
import {
  inventorySubcategories,
  miscellaneousSubcategories,
  paymentMethods,
  type Expense,
} from './types';
import { ledgerError, pickExpenseReceipt } from './ledgerFiles';

export function ExpenseFormScreen({
  route,
  navigation,
}: RootScreenProps<'ExpenseForm'>) {
  const ledger = useLedger();
  const { t } = useTranslation();
  const expense = ledger.expenses.find(
    value => value.id === route.params.expenseId,
  );
  if (ledger.error || (route.params.expenseId && !expense))
    return (
      <Screen
        header={
          <AppHeader
            title={t('ledger.editExpense')}
            onBack={navigation.goBack}
          />
        }
      >
        <EmptyState
          title={t(ledger.error || 'ledger.notFound')}
          description={t('ledger.notFoundHint')}
        />
      </Screen>
    );
  return (
    <ExpenseForm
      key={expense?.id ?? 'new'}
      expense={expense}
      navigation={navigation}
    />
  );
}
function ExpenseForm({
  expense,
  navigation,
}: {
  expense?: Expense;
  navigation: RootScreenProps<'ExpenseForm'>['navigation'];
}) {
  const { t, i18n } = useTranslation();
  const form = useExpenseForm(expense, navigation.goBack);
  const { draft, update, errors } = form;
  const [sheet, setSheet] = useState<
    'category' | 'subcategory' | 'payment' | 'date' | 'time' | 'receipt' | null
  >(null);
  const [expanded, setExpanded] = useState(false);
  const [picking, setPicking] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const pickingRef = useRef(false);
  const nameInput = useRef<TextInputInstance>(null);
  const amountInput = useRef<TextInputInstance>(null);
  const { contentWidth, fontScale } = useResponsiveLayout(contentWidths.form);
  const stack = contentWidth < 310 || fontScale >= 1.3;
  const close = () => setSheet(null);
  const submit = () => {
    if (pickingRef.current) return;
    form.submit();
    const invalid = validateExpenseDraft(draft);
    if (invalid.name) nameInput.current?.focus();
    else if (invalid.amount) amountInput.current?.focus();
  };
  async function attach(source: 'camera' | 'gallery' | 'file') {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setPicking(true);
    setReceiptError('');
    close();
    try {
      const receipt = await pickExpenseReceipt(source);
      if (receipt) {
        update('receipt', receipt);
        setExpanded(true);
      }
    } catch (cause) {
      setReceiptError(ledgerError(cause, 'ledger.receiptFailed'));
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  }
  return (
    <>
      <Screen
        contentMaxWidth={contentWidths.form}
        header={
          <AppHeader
            title={t(expense ? 'ledger.editExpense' : 'ledger.newExpense')}
            subtitle={t('ledger.formSubtitle')}
            onBack={navigation.goBack}
            maxWidth={contentWidths.form}
            backDisabled={picking}
          />
        }
        footer={
          <>
            {!!form.error && (
              <AppText accessibilityRole="alert" style={controls.error}>
                {t(form.error)}
              </AppText>
            )}
            <View style={controls.row}>
              <AppButton
                variant="ghost"
                onPress={navigation.goBack}
                disabled={picking}
                style={controls.field}
              >
                {t('auth.cancel')}
              </AppButton>
              <AppButton
                onPress={submit}
                disabled={picking}
                style={controls.field}
                wrapLabel
              >
                {t(expense ? 'ledger.saveChanges' : 'ledger.saveExpense')}
              </AppButton>
            </View>
          </>
        }
      >
        <AppInput
          ref={nameInput}
          label={t('ledger.expenseName')}
          labelStyle={controls.inputLabel}
          placeholder={t('ledger.namePlaceholder')}
          value={draft.name}
          maxLength={120}
          onChangeText={value => update('name', value)}
          error={errors.name && t(errors.name)}
          returnKeyType="next"
          onSubmitEditing={() => amountInput.current?.focus()}
        />
        <View style={[controls.row, stack && controls.stacked]}>
          <View style={controls.field}>
            <ExpenseSelect
              label={t('ledger.category')}
              value={t(`ledger.options.${draft.category}`)}
              onPress={() => setSheet('category')}
            />
          </View>
          <View style={controls.field}>
            <ExpenseSelect
              label={t('ledger.subcategoryOptional')}
              value={t(`ledger.options.${draft.subcategory || 'none'}`)}
              onPress={() => setSheet('subcategory')}
            />
          </View>
        </View>
        <AppInput
          ref={amountInput}
          label={t('ledger.amount')}
          labelStyle={controls.inputLabel}
          placeholder="₹0.00"
          keyboardType="decimal-pad"
          maxLength={15}
          value={draft.amount ? `₹${draft.amount}` : ''}
          onChangeText={value => update('amount', value.replace(/[₹,\s]/g, ''))}
          error={errors.amount && t(errors.amount)}
        />
        <View style={[controls.row, stack && controls.stacked]}>
          <View style={controls.field}>
            <ExpenseSelect
              label={t('ledger.date')}
              value={expenseDate(draft.date, i18n.language)}
              icon="calendar"
              onPress={() => setSheet('date')}
            />
          </View>
          <View style={controls.field}>
            <ExpenseSelect
              label={t('ledger.time')}
              value={expenseTime(draft.time, i18n.language)}
              icon="clock"
              onPress={() => setSheet('time')}
            />
          </View>
        </View>
        <AppInput
          label={t('ledger.vendorOptional')}
          labelStyle={controls.inputLabel}
          placeholder={t('ledger.vendorPlaceholder')}
          value={draft.vendor}
          onChangeText={value => update('vendor', value)}
          maxLength={200}
        />
        <ExpenseSelect
          label={t('ledger.paymentOptional')}
          value={t(`ledger.options.${draft.payment || 'none'}`)}
          onPress={() => setSheet('payment')}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(value => !value)}
          style={styles.expand}
        >
          <AppText style={styles.expandText}>
            {t('ledger.notesReceipt')}
          </AppText>
          <View
            style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}
          >
            <Icon name="arrow" size={18} />
          </View>
        </Pressable>
        {expanded && (
          <View style={styles.extra}>
            <AppInput
              label={t('ledger.notesOptional')}
              labelStyle={controls.inputLabel}
              placeholder={t('ledger.notesPlaceholder')}
              value={draft.notes}
              onChangeText={value => update('notes', value)}
              multiline
              maxLength={2000}
              style={styles.notes}
            />
            {draft.receipt && (
              <View style={styles.receipt}>
                <Icon name="file" size={26} />
                <AppText style={controls.field}>{draft.receipt.name}</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('ledger.removeReceipt')}
                  onPress={() => update('receipt', undefined)}
                  style={styles.remove}
                >
                  <Icon name="close" size={20} />
                </Pressable>
              </View>
            )}
            <AppButton
              variant="secondary"
              icon="camera"
              loading={picking}
              onPress={() => setSheet('receipt')}
            >
              {t(draft.receipt ? 'ledger.replaceReceipt' : 'ledger.addReceipt')}
            </AppButton>
          </View>
        )}
        {!!receiptError && (
          <AppText accessibilityRole="alert" style={controls.error}>
            {t(receiptError)}
          </AppText>
        )}
      </Screen>
      <ExpenseChoiceSheet
        title={t('ledger.expenseCategory')}
        options={['inventory', 'miscellaneous'] as const}
        selected={draft.category}
        visible={sheet === 'category'}
        onClose={close}
        onSelect={value => {
          update('category', value);
          close();
        }}
      />
      <ExpenseChoiceSheet
        title={t(
          draft.category === 'inventory'
            ? 'ledger.inventorySubcategory'
            : 'ledger.miscSubcategory',
        )}
        options={[
          'none',
          ...(draft.category === 'inventory'
            ? inventorySubcategories
            : miscellaneousSubcategories),
        ]}
        selected={draft.subcategory || 'none'}
        visible={sheet === 'subcategory'}
        onClose={close}
        onSelect={value => {
          update('subcategory', value === 'none' ? '' : value);
          close();
        }}
      />
      <ExpenseChoiceSheet
        title={t('ledger.paymentMethod')}
        options={['none', ...paymentMethods]}
        selected={draft.payment || 'none'}
        visible={sheet === 'payment'}
        onClose={close}
        onSelect={value => {
          update(
            'payment',
            value === 'none' ? undefined : (value as typeof draft.payment),
          );
          close();
        }}
      />
      {sheet === 'date' && (
        <ExpenseDateSheet
          title={t('ledger.selectDate')}
          value={draft.date}
          onClose={close}
          onSelect={value => {
            update('date', value);
            close();
          }}
        />
      )}
      {sheet === 'time' && (
        <ExpenseTimeSheet
          value={draft.time}
          onClose={close}
          onSelect={value => {
            update('time', value);
            close();
          }}
        />
      )}
      <BottomSheet
        visible={sheet === 'receipt'}
        title={t('ledger.addReceipt')}
        onClose={close}
      >
        {(['camera', 'gallery', 'file'] as const).map(source => (
          <SheetOption
            key={source}
            label={t(`ledger.source.${source}`)}
            plain
            trailing
            onPress={() => {
              attach(source);
            }}
          />
        ))}
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  expand: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  expandText: { fontSize: 12, lineHeight: 16.8, color: colors.forest },
  extra: { marginTop: 16 },
  notes: { minHeight: 94, textAlignVertical: 'top' },
  receipt: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  remove: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
