import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Badge } from '../../components/Badge';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SearchInput } from '../../components/SearchInput';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { filterMenu } from '../menu/menuData';
import { orderLines } from './orderCalculations';
import { OrderDishRow } from './OrderDishRow';
import { useOrderDraft } from './useOrderDraft';

export function OrderScreen({ navigation, route }: RootScreenProps<'Order'>) {
  const { t } = useTranslation();
  const draft = useOrderDraft(route.params.tableId, route.params.customerId);
  const showFeedback = useFeedback();
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
  const [canLeave, setCanLeave] = useState(false);
  usePreventRemove(draft.isDirty && !canLeave, ({ data }) =>
    setPendingAction(data.action),
  );
  useEffect(() => {
    if (canLeave) {
      if (pendingAction) {
        navigation.dispatch(pendingAction);
      } else {
        navigation.goBack();
      }
    }
  }, [canLeave, navigation, pendingAction]);
  function handleConfirm() {
    if (draft.saveOrder()) {
      showFeedback(
        t('orders.orderSavedForValue', { value0: draft.name.trim() }),
      );
      setCanLeave(true);
    }
  }
  const dishes = filterMenu(draft.search);
  if (!draft.isAvailable) {
    return (
      <Screen>
        <EmptyState
          title={t('orders.orderUnavailable')}
          description={t('orders.thisCustomerOrTableIsNoLongerActive')}
          action={{
            label: t('orders.backToFloor'),
            onPress: () => navigation.popToTop(),
          }}
        />
      </Screen>
    );
  }
  return (
    <>
      <Screen
        header={
          <AppHeader
            title={
              draft.isEditing ? t('orders.editOrder') : t('orders.newCustomer')
            }
            subtitle={t('orders.tableValueWaiter', {
              value0: route.params.tableId,
            })}
            onBack={navigation.goBack}
          />
        }
        footer={
          <>
            <View style={[layout.row, styles.total]}>
              <AppText variant="small">
                {t('orders.valueItemsCustomerOrder', {
                  value0: draft.itemCount,
                })}
              </AppText>
              <AppText style={styles.amount}>
                {formatCurrency(draft.total)}
              </AppText>
            </View>
            <AppButton
              disabled={!draft.itemCount}
              onPress={handleConfirm}
              icon="check"
              iconPosition="after"
            >
              {t('orders.confirmOrder')}
            </AppButton>
          </>
        }
      >
        <AppInput
          label={t('orders.customerName')}
          value={draft.name}
          onChangeText={draft.setName}
          placeholder={t('orders.nameOnTheOrder')}
          error={draft.error}
        />
        <View style={[layout.section, styles.section]}>
          <AppText variant="section">{t('orders.whatCanWeGetYou')}</AppText>
          <Badge>{t('orders.valueItems', { value0: draft.itemCount })}</Badge>
        </View>
        <SearchInput
          value={draft.search}
          onChangeText={draft.setSearch}
          placeholder={t('orders.findADish')}
        />
        {dishes.map(dish => (
          <OrderDishRow
            key={dish.id}
            dish={dish}
            quantity={draft.items[dish.id] ?? 0}
            onChange={change => draft.updateQuantity(dish.id, change)}
          />
        ))}
        {!dishes.length && (
          <AppText muted style={styles.empty}>
            {t('orders.noDishesFound')}
          </AppText>
        )}
        <View style={styles.summary}>
          <AppText style={styles.summaryTitle}>
            {t('orders.orderSummary')}
          </AppText>
          {draft.itemCount ? (
            orderLines(draft.items).map(line => (
              <View key={line.dish.id} style={[layout.row, styles.summaryLine]}>
                <AppText muted variant="small">
                  {line.dish.name} × {line.quantity}
                </AppText>
                <AppText muted variant="small">
                  {formatCurrency(line.amount)}
                </AppText>
              </View>
            ))
          ) : (
            <AppText muted variant="small">
              {t('orders.addDishesToStartThisOrder')}
            </AppText>
          )}
        </View>
      </Screen>
      <ConfirmationSheet
        visible={!!pendingAction && !canLeave}
        title={t('orders.leaveThisOrder')}
        description={t(
          'orders.yourUnsavedChangesWillBeDiscardedConfirmTheOrder',
        )}
        confirmLabel={t('orders.keepEditing')}
        cancelLabel={t('orders.discardChanges')}
        onConfirm={() => setPendingAction(null)}
        onCancel={() => setCanLeave(true)}
        onDismiss={() => setPendingAction(null)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 0 },
  total: { marginBottom: 12 },
  amount: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  summary: {
    padding: 18,
    backgroundColor: colors.sage,
    borderRadius: 23,
    marginTop: 24,
  },
  summaryTitle: { fontWeight: '700', marginBottom: 8 },
  summaryLine: { marginTop: 8 },
  empty: { paddingVertical: 40, textAlign: 'center' },
});
