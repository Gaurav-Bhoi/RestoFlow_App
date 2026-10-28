import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { AppHeader } from '../../components/AppHeader';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/EmptyState';
import { ModalSurface } from '../../components/ModalSurface';
import { ConfirmationDialogContent } from '../../components/ConfirmationDialog';
import { colors, radius } from '../../theme/tokens';
import { useLedger } from './LedgerProvider';
import {
  LedgerIconButton,
  expenseControlStyles as controls,
} from './ExpenseControls';
import { expenseDate, expenseMoney, expenseTime } from './expenseFormatting';
import { ledgerError } from './ledgerFiles';

export function ExpenseDetailsScreen({
  route,
  navigation,
}: RootScreenProps<'ExpenseDetails'>) {
  const { t, i18n } = useTranslation();
  const ledger = useLedger();
  const expense = ledger.expenses.find(
    item => item.id === route.params.expenseId,
  );
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  function remove() {
    try {
      ledger.remove(route.params.expenseId);
      setDeleting(false);
      navigation.goBack();
    } catch (cause) {
      setError(ledgerError(cause));
    }
  }
  if (!expense || ledger.error)
    return (
      <Screen
        header={
          <AppHeader
            title={t('ledger.expenseDetails')}
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
  const details = [
    [
      t('ledger.dateTime'),
      `${expenseDate(expense.date, i18n.language)} · ${expenseTime(
        expense.time,
        i18n.language,
      )}`,
    ],
    [t('ledger.vendor'), expense.vendor || t('ledger.notProvided')],
    [
      t('ledger.paymentMethod'),
      t(`ledger.options.${expense.payment || 'none'}`),
    ],
  ];
  return (
    <>
      <Screen
        header={
          <AppHeader
            title={t('ledger.expenseDetails')}
            subtitle={t('ledger.detailsSubtitle')}
            onBack={navigation.goBack}
            right={
              <LedgerIconButton
                icon="trash"
                label={t('ledger.deleteExpense')}
                onPress={() => setDeleting(true)}
              />
            }
          />
        }
        footer={
          <AppButton
            icon="edit"
            onPress={() =>
              navigation.navigate('ExpenseForm', { expenseId: expense.id })
            }
          >
            {t('ledger.editExpense')}
          </AppButton>
        }
      >
        <View style={styles.summary}>
          <AppText style={styles.name}>{expense.name}</AppText>
          <AppText variant="display" style={styles.amount}>
            {expenseMoney(expense.amountPaise)}
          </AppText>
          <AppText variant="helper" muted style={styles.category}>
            {[
              t(`ledger.options.${expense.category}`),
              expense.subcategory && t(`ledger.options.${expense.subcategory}`),
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
        <View style={styles.details}>
          {details.map(([label, value]) => (
            <View key={label} style={styles.detail}>
              <AppText variant="helper" muted>
                {label}
              </AppText>
              <AppText style={styles.value}>{value}</AppText>
            </View>
          ))}
        </View>
        <View style={styles.notes}>
          <AppText variant="helper" muted>
            {t('ledger.descriptionNotes')}
          </AppText>
          <AppText style={styles.value}>
            {expense.notes || t('ledger.noNotes')}
          </AppText>
        </View>
        <Pressable
          accessibilityRole={expense.receipt ? 'button' : undefined}
          disabled={!expense.receipt}
          accessibilityLabel={
            expense.receipt
              ? `${t('ledger.previewReceipt')}: ${expense.receipt.name}`
              : t('ledger.noReceipt')
          }
          onPress={() => {
            if (expense.receipt)
              navigation.navigate('ExpenseReceipt', {
                receipt: expense.receipt,
              });
          }}
          style={styles.receipt}
        >
          <Icon name="file" size={26} />
          <View style={controls.field}>
            <AppText style={styles.receiptName}>
              {expense.receipt?.name ?? t('ledger.noReceipt')}
            </AppText>
            <AppText muted variant="helper" style={styles.receiptHint}>
              {t(
                expense.receipt
                  ? 'ledger.tapPreview'
                  : 'ledger.addWhileEditing',
              )}
            </AppText>
          </View>
        </Pressable>
      </Screen>
      <ModalSurface
        visible={deleting}
        centered
        onClose={() => setDeleting(false)}
      >
        <ConfirmationDialogContent
          title={t('ledger.deleteQuestion')}
          description={t('ledger.deleteWarning')}
          confirmLabel={t('ledger.delete')}
          onCancel={() => setDeleting(false)}
          onConfirm={remove}
          error={error && t(error)}
        />
      </ModalSurface>
    </>
  );
}
const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.sage,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 143,
  },
  name: { fontSize: 18, lineHeight: 25.2 },
  amount: { color: colors.forest, marginTop: 4 },
  category: { marginTop: 10, lineHeight: 15.4 },
  details: { marginTop: 26 },
  detail: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingTop: 10,
    gap: 6,
  },
  value: { fontSize: 14, lineHeight: 19.6 },
  notes: { marginTop: 26, gap: 12 },
  receipt: {
    marginTop: 42,
    padding: 16,
    minHeight: 79,
    borderRadius: 22,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  receiptName: { fontSize: 13, lineHeight: 18.2 },
  receiptHint: { marginTop: 8, lineHeight: 15.4 },
});
