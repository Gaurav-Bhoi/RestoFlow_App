import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { SuccessState } from '../../components/SuccessState';
import { useCustomerBill } from './useCustomerBill';

export function PrintSuccessScreen({
  route,
  navigation,
}: RootScreenProps<'PrintSuccess'>) {
  const { t } = useTranslation();
  const bill = useCustomerBill(route.params.tableId, route.params.customerId);
  const handleFinishVisit = async () => {
    if (await bill.finishVisit()) navigation.popToTop();
  };
  return (
    <Screen header={<AppHeader title={t('billing.receiptSent')} />}>
      {!!bill.error && (
        <AppText accessibilityRole="alert">{bill.error}</AppText>
      )}
      <SuccessState
        title={t('billing.readyForTheNextGuest')}
        description={t(
          'billing.thePrintServiceWasOpenedConfirmTheReceiptPrinted',
        )}
      >
        <AppButton
          loading={bill.isFinishing}
          disabled={bill.loading || !!bill.error}
          onPress={handleFinishVisit}
          style={styles.button}
        >
          {t('billing.finishCustomerVisit')}
        </AppButton>
        <AppButton
          variant="secondary"
          onPress={() => navigation.replace('Receipt', route.params)}
          style={styles.reprint}
        >
          {t('billing.reprintReceipt')}
        </AppButton>
        <AppText muted variant="small" style={styles.note}>
          {t('billing.otherGuestsAtThisTableStayActive')}
        </AppText>
      </SuccessState>
    </Screen>
  );
}
const styles = StyleSheet.create({
  button: { alignSelf: 'stretch' },
  reprint: { alignSelf: 'stretch', marginTop: 10 },
  note: { marginTop: 17 },
});
