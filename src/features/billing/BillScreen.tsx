import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  usePreventRemove,
  useIsFocused,
  type NavigationAction,
} from '@react-navigation/native';
import type { RootScreenProps } from '../../app/navigationTypes';
import type { BillLine } from '../../api/billing';
import { restaurantApi } from '../../api/restoflow';
import { normalizeApiError } from '../../api/errors';
import { useFeedback } from '../../app/FeedbackProvider';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { BottomSheet } from '../../components/BottomSheet';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { ConfirmationDialog } from '../../components/ConfirmationDialog';
import { SheetOption } from '../../components/SheetOption';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { useBillDraft } from './useBillDraft';
import { BillIconButton } from './BillControls';
import { BillItemEditor, type BillField } from './BillItemEditor';
import { BillAddItemSheet } from './BillAddItemSheet';
import { EditableBillItems } from './EditableBillItems';
import { billId } from './billDraft';

export function BillScreen({ navigation, route }: RootScreenProps<'Bill'>) {
  const { t } = useTranslation();
  const draft = useBillDraft(route.params.tableId, route.params.customerId);
  const focused = useIsFocused();
  const feedback = useFeedback();
  const [editor, setEditor] = useState<{ id: string; field: BillField } | null>(
    null,
  );
  const [sheet, setSheet] = useState<'add' | 'manage' | 'review' | null>(null);
  const [remove, setRemove] = useState<BillLine | null>(null);
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
  const [canLeave, setCanLeave] = useState(false);
  const [reload, setReload] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [latest, setLatest] = useState<BillLine[] | null>(null);
  useEffect(() => {
    setReviewed(false);
  }, [draft.original]);
  usePreventRemove(
    (draft.busy || (focused && draft.dirty)) && !canLeave,
    ({ data }) => {
      if (!draft.busy) setPendingAction(data.action);
    },
  );
  useEffect(() => {
    if (canLeave && pendingAction) navigation.dispatch(pendingAction);
  }, [canLeave, navigation, pendingAction]);
  const bill = draft.bill;
  const needsReview = !!bill?.orderChanged && !reviewed;
  const blocked =
    draft.busy ||
    draft.loading ||
    draft.conflict ||
    needsReview ||
    !!bill?.closedAt;
  async function save() {
    if (await draft.save()) feedback(t('billing.billUpdated'));
  }
  async function reviewOrder() {
    try {
      const order = await restaurantApi.getOrder(
        draft.restaurant.id,
        route.params.customerId,
      );
      if (order.tableId !== route.params.tableId) return;
      setLatest(order.items);
      setSheet('review');
    } catch (cause) {
      feedback(normalizeApiError(cause).message);
    }
  }
  if (draft.loading || !bill)
    return (
      <Screen
        header={
          <AppHeader
            wrap
            title={t('billing.previewAndPrint')}
            onBack={navigation.goBack}
          />
        }
      >
        {draft.error ? (
          <EmptyState
            title={t('api.loadBillFailed')}
            description={draft.error}
            action={{
              label: t('api.retry'),
              onPress: () => {
                draft.load();
              },
            }}
          />
        ) : (
          <AppText>{t('api.loadingBill')}</AppText>
        )}
      </Screen>
    );
  const activeLine = draft.items.find(line => line.id === editor?.id);
  return (
    <>
      <Screen
        header={
          <AppHeader
            wrap
            title={t('billing.previewAndPrint')}
            subtitle={t('billing.customerScope', {
              table: bill.table.name,
              name: bill.customerName,
            })}
            onBack={navigation.goBack}
            backDisabled={draft.busy}
            right={
              <BillIconButton
                icon="save"
                label={t('billing.saveBill')}
                onPress={save}
                busy={draft.busy}
                disabled={blocked || !draft.items.length}
              />
            }
          />
        }
        footer={
          <AppButton
            wrapLabel
            icon="print"
            disabled={blocked || !draft.items.length}
            onPress={() =>
              navigation.navigate('Receipt', {
                ...route.params,
                draft: draft.draft!,
              })
            }
          >
            {t('billing.previewAndPrint')}
          </AppButton>
        }
      >
        <View style={styles.summary}>
          <View style={styles.summaryText}>
            <AppText style={styles.restaurant}>
              {bill.restaurantName.toLocaleUpperCase()}
            </AppText>
            <AppText style={styles.customer}>{bill.customerName}</AppText>
            <AppText style={styles.meta}>
              {t('billing.billMeta', {
                count: bill.itemCount,
                number: bill.billNumber ?? t('billing.notSaved'),
              })}
            </AppText>
          </View>
          <Icon name="cutlery" size={47} color="#53776a" />
        </View>
        {!!draft.error && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {draft.error}
          </AppText>
        )}
        {draft.localDraft && <Notice>{t('bluetooth.restoredDraft')}</Notice>}
        {draft.conflict && (
          <AppButton
            wrapLabel
            variant="secondary"
            onPress={() => setReload(true)}
          >
            {t('billing.reloadBill')}
          </AppButton>
        )}
        {needsReview && (
          <View style={styles.review}>
            <Notice>{t('billing.orderChanged')}</Notice>
            <AppButton wrapLabel variant="secondary" onPress={reviewOrder}>
              {t('billing.reviewOrder')}
            </AppButton>
          </View>
        )}
        {bill.closedAt && <Notice>{t('billing.visitCompleted')}</Notice>}
        <View style={styles.hintRow}>
          <AppText muted style={styles.hint}>
            {t('billing.tapToEdit')}
          </AppText>
          <BillIconButton
            plain
            icon="more"
            label={t('billing.manageItems')}
            disabled={blocked}
            onPress={() => setSheet('manage')}
          />
        </View>
        <EditableBillItems
          items={bill.items}
          disabled={blocked}
          onEdit={(id, field) => setEditor({ id, field })}
          onRemove={setRemove}
        />
        {!bill.items.length && (
          <AppText muted style={styles.empty}>
            {t('billing.emptyBill')}
          </AppText>
        )}
        <AppButton
          wrapLabel
          variant="ghost"
          icon="plus"
          disabled={blocked || bill.items.length >= 100}
          onPress={() => setSheet('add')}
          style={styles.add}
        >
          {t('billing.addItem')}
        </AppButton>
        <View style={styles.totals}>
          <View style={layout.row}>
            <AppText muted variant="small">
              {t('billing.subtotal')}
            </AppText>
            <AppText style={styles.subtotal}>
              {formatCurrency(bill.subtotal)}
            </AppText>
          </View>
          <View style={[layout.row, styles.taxes]}>
            <AppText muted variant="small">
              {t('billing.taxesCharges')}
            </AppText>
            <AppText style={styles.subtotal}>
              {formatCurrency(bill.taxesAndCharges)}
            </AppText>
          </View>
          <View style={[layout.row, styles.grand]}>
            <AppText style={styles.totalLabel}>
              {t('billing.totalBill')}
            </AppText>
            <AppText accessibilityLiveRegion="polite" style={styles.total}>
              {formatCurrency(bill.total)}
            </AppText>
          </View>
        </View>
        {draft.dirty && (
          <AppText style={styles.unsaved}>
            {t('billing.unsavedChanges')}
          </AppText>
        )}
      </Screen>
      {editor && activeLine && (
        <BillItemEditor
          key={`${editor.id}-${editor.field}`}
          line={activeLine}
          field={editor.field}
          onClose={() => setEditor(null)}
          onApply={line => {
            draft.setItems(items =>
              items.map(item => (item.id === line.id ? line : item)),
            );
            setEditor(null);
          }}
        />
      )}
      {sheet === 'add' && (
        <BillAddItemSheet
          menu={draft.restaurant.menu}
          name={bill.customerName ?? ''}
          onClose={() => setSheet(null)}
          onAdd={dish => {
            if (draft.items.length >= 100) return;
            draft.setItems(items => [
              ...items,
              {
                id: billId(),
                dishId: dish.id,
                name: dish.name,
                quantity: 1,
                unitPrice: dish.price.toFixed(2),
                lineTotal: dish.price.toFixed(2),
                note: null,
              },
            ]);
            setSheet(null);
          }}
        />
      )}
      <BottomSheet
        visible={sheet === 'manage'}
        title={t('billing.manageItems')}
        onClose={() => setSheet(null)}
      >
        {bill.items.map(line => (
          <SheetOption
            key={line.id}
            plain
            trailing
            label={t('billing.removeNamedItem', { name: line.name })}
            onPress={() => {
              setSheet(null);
              setRemove(line);
            }}
          />
        ))}
        <SheetOption
          plain
          trailing
          label={t('billing.addAnotherItem')}
          disabled={bill.items.length >= 100}
          onPress={() => setSheet('add')}
        />
        <SheetOption
          plain
          trailing
          label={t('billing.viewDetails')}
          onPress={() => {
            setSheet(null);
            navigation.navigate('BillOverview', {
              ...route.params,
              draft: draft.draft!,
            });
          }}
        />
        <SheetOption
          plain
          trailing
          label={t('orders.keepEditing')}
          onPress={() => setSheet(null)}
        />
      </BottomSheet>
      <BottomSheet
        visible={sheet === 'review'}
        title={t('billing.reviewOrder')}
        onClose={() => setSheet(null)}
      >
        <AppText muted variant="small">
          {t('billing.reviewOrderDescription')}
        </AppText>
        {latest?.map(line => (
          <View key={line.id} style={layout.row}>
            <AppText>
              {line.name} × {line.quantity}
            </AppText>
            <AppText>{formatCurrency(line.lineTotal)}</AppText>
          </View>
        ))}
        <AppButton
          wrapLabel
          onPress={() => {
            if (latest) draft.setItems(latest);
            setReviewed(true);
            setSheet(null);
          }}
        >
          {t('billing.useLatestOrder')}
        </AppButton>
        <AppButton
          wrapLabel
          variant="secondary"
          onPress={() => {
            setReviewed(true);
            setSheet(null);
          }}
        >
          {t('billing.keepBillItems')}
        </AppButton>
      </BottomSheet>
      <ConfirmationDialog
        visible={!!remove}
        title={t('billing.removeNamedItemQuestion', { name: remove?.name })}
        description={t('billing.removeDescription', {
          count: remove?.quantity,
          item: remove?.name,
          name: bill.customerName,
        })}
        cancelLabel={t('billing.keepItem')}
        confirmLabel={t('billing.remove')}
        onCancel={() => setRemove(null)}
        onConfirm={() => {
          draft.setItems(items => items.filter(line => line.id !== remove?.id));
          setRemove(null);
        }}
      />
      <ConfirmationSheet
        visible={!!pendingAction && !canLeave}
        title={t('billing.discardBillTitle')}
        description={t('billing.discardBillDescription')}
        confirmLabel={t('orders.keepEditing')}
        cancelLabel={t('orders.discardChanges')}
        onConfirm={() => setPendingAction(null)}
        onCancel={() => setCanLeave(true)}
        onDismiss={() => setPendingAction(null)}
      />
      <ConfirmationDialog
        visible={reload}
        title={t('billing.reloadBill')}
        description={t('billing.reloadDescription')}
        confirmLabel={t('billing.reloadBill')}
        onCancel={() => setReload(false)}
        onConfirm={() => {
          setReload(false);
          draft.load();
        }}
      />
    </>
  );
}
const styles = StyleSheet.create({
  summary: {
    borderRadius: 24,
    backgroundColor: colors.forest,
    minHeight: 113,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryText: { flex: 1 },
  restaurant: { fontSize: 10, lineHeight: 14, color: '#d4e4d8' },
  customer: {
    fontSize: 22,
    lineHeight: 30.8,
    color: colors.white,
    marginTop: 10,
  },
  meta: { color: '#d4e4d8', fontSize: 11, lineHeight: 15.4, marginTop: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  hint: { flex: 1, fontSize: 11, lineHeight: 15.4 },
  add: { marginTop: 8 },
  totals: { marginTop: 25, paddingRight: 44 },
  taxes: { marginTop: 12 },
  subtotal: { fontSize: 13, lineHeight: 18.2 },
  grand: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginRight: -44,
    paddingRight: 44,
  },
  totalLabel: { fontSize: 16, lineHeight: 22.4 },
  total: { fontSize: 25, lineHeight: 35, color: colors.forest },
  unsaved: { color: '#b65435', fontSize: 10, lineHeight: 14, marginTop: 14 },
  error: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
    marginTop: 12,
    marginBottom: 8,
  },
  review: { gap: 8, marginTop: 12 },
  empty: { paddingVertical: 24, textAlign: 'center' },
});
