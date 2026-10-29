import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreventRemove } from '@react-navigation/native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { billingApi } from '../../api/billing';
import { normalizeApiError } from '../../api/errors';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { BillStatus } from './BillStatus';
import { SuccessState } from '../../components/SuccessState';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSession } from '../auth/SessionProvider';

export function PrintSuccessScreen({
  route,
  navigation,
}: RootScreenProps<'PrintSuccess'>) {
  const { t } = useTranslation();
  const { restaurant, refresh } = useRestaurant();
  const { session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const [confirmVisit, setConfirmVisit] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (finished && !busy)
      navigation.popTo('Customers', { tableId: route.params.tableId });
  }, [finished, busy, navigation, route.params.tableId]);
  usePreventRemove(busy, () => undefined);
  async function finish() {
    if (pending.current || session?.role !== 'owner') return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const { customerId, printJobId } = route.params;
      const job = await billingApi.printJob(
        restaurant.id,
        customerId,
        printJobId,
      );
      if (job.receipt.table.id !== route.params.tableId)
        throw new Error('The order does not belong to this table.');
      if (job.status === 'SENT')
        await billingApi.updatePrintJob(
          restaurant.id,
          customerId,
          printJobId,
          'CONFIRMED',
        );
      const result = await billingApi.finish(
        restaurant.id,
        customerId,
        printJobId,
      );
      if (!result.finished) throw new Error('The visit could not be finished.');
      await refresh().catch(() => undefined);
      // Release the navigation guard before removing this screen.
      setFinished(true);
    } catch (cause) {
      setError(normalizeApiError(cause).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (!confirmVisit)
    return (
      <Screen>
        <BillStatus
          title={t('billing.billSentToPrinter')}
          description={t('billing.otherOrdersSaved')}
        >
          <AppButton
            wrapLabel
            onPress={() =>
              navigation.popTo('Customers', { tableId: route.params.tableId })
            }
          >
            {t('billing.backToCustomers')}
          </AppButton>
          <AppButton
            wrapLabel
            variant="secondary"
            onPress={() => setConfirmVisit(true)}
          >
            {t('billing.confirmReceipt')}
          </AppButton>
        </BillStatus>
      </Screen>
    );
  return (
    <Screen header={<AppHeader wrap title={t('billing.receiptSent')} />}>
      <SuccessState
        title={t('billing.readyForTheNextGuest')}
        description={t(
          'billing.thePrintServiceWasOpenedConfirmTheReceiptPrinted',
        )}
      >
        {!!error && (
          <AppText accessibilityRole="alert" style={styles.error}>
            {error}
          </AppText>
        )}
        <AppButton
          wrapLabel
          loading={busy}
          onPress={finish}
          style={styles.button}
        >
          {t('billing.finishCustomerVisit')}
        </AppButton>
        <AppButton
          wrapLabel
          variant="secondary"
          disabled={busy}
          onPress={() =>
            navigation.replace('Receipt', {
              tableId: route.params.tableId,
              customerId: route.params.customerId,
            })
          }
          style={styles.reprint}
        >
          {t('billing.reprintReceipt')}
        </AppButton>
        <AppText muted style={styles.note}>
          {t('billing.otherGuestsAtThisTableStayActive')}
        </AppText>
      </SuccessState>
    </Screen>
  );
}
const styles = StyleSheet.create({
  button: { alignSelf: 'stretch', marginTop: 30 },
  reprint: { alignSelf: 'stretch', marginTop: 25 },
  note: { fontSize: 13, lineHeight: 22.1, marginTop: 17, textAlign: 'center' },
  error: { marginBottom: 12, color: '#bd3030' },
});
