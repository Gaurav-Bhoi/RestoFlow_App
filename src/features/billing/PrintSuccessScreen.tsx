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
  const bill = useCustomerBill(route.params.tableId, route.params.customerId);
  const handleFinishVisit = () => {
    bill.finishVisit();
    navigation.popToTop();
  };
  return (
    <Screen header={<AppHeader title="Receipt sent" />}>
      <SuccessState
        title="Ready for the next guest."
        description="The print service was opened. Confirm the receipt printed before finishing this visit."
      >
        <AppButton onPress={handleFinishVisit} style={styles.button}>
          Finish customer visit
        </AppButton>
        <AppButton
          variant="secondary"
          onPress={() => navigation.replace('Receipt', route.params)}
          style={styles.reprint}
        >
          Reprint receipt
        </AppButton>
        <AppText muted variant="small" style={styles.note}>
          Other guests at this table stay active.
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
