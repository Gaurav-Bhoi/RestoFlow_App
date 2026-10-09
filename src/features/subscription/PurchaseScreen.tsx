import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { SuccessState } from '../../components/SuccessState';
import { colors } from '../../theme/tokens';
import { useSubscription } from './useSubscription';
import { PlanCard } from './PlanCard';

export function PurchaseScreen({ navigation }: RootScreenProps<'Purchase'>) {
  const { activatePremium } = useSubscription();
  const handlePurchase = () => {
    activatePremium();
    navigation.replace('PurchaseSuccess');
  };
  return (
    <Screen
      header={
        <AppHeader
          title="Keep the good flow"
          subtitle="Your restaurant workspace awaits."
        />
      }
      footer={
        <AppButton icon="arrow" iconPosition="after" onPress={handlePurchase}>
          Continue to purchase
        </AppButton>
      }
    >
      <PlanCard isPremium daysRemaining={0} progress={1} isPurchase />
      <View style={styles.info}>
        <Icon name="info" size={18} color={colors.terracotta} />
        <AppText style={styles.infoText}>
          Price and payment details come from your subscription provider. No
          payment will be collected in this prototype.
        </AppText>
      </View>
      <Notice icon="shield">
        Your tables, team, and orders remain ready to continue.
      </Notice>
    </Screen>
  );
}
export function PurchaseSuccessScreen({
  navigation,
}: RootScreenProps<'PurchaseSuccess'>) {
  return (
    <Screen header={<AppHeader title="Your subscription" />}>
      <SuccessState
        title="Back in full flow."
        description={
          'Your demo subscription is active.\nYour restaurant is ready for service.'
        }
      >
        <AppButton style={styles.button} onPress={() => navigation.popToTop()}>
          Continue to dashboard
        </AppButton>
      </SuccessState>
    </Screen>
  );
}
const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 24,
    paddingHorizontal: 3,
  },
  infoText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 21 },
  button: { alignSelf: 'stretch' },
});
