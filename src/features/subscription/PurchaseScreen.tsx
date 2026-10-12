import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { activatePremium } = useSubscription();
  const handlePurchase = () => {
    activatePremium();
    navigation.replace('PurchaseSuccess');
  };
  return (
    <Screen
      header={
        <AppHeader
          title={t('subscription.keepTheGoodFlow')}
          subtitle={t('subscription.yourRestaurantWorkspaceAwaits')}
        />
      }
      footer={
        <AppButton icon="arrow" iconPosition="after" onPress={handlePurchase}>
          {t('subscription.continueToPurchase')}
        </AppButton>
      }
    >
      <PlanCard isPremium daysRemaining={0} progress={1} isPurchase />
      <View style={styles.info}>
        <Icon name="info" size={18} color={colors.terracotta} />
        <AppText style={styles.infoText}>
          {t(
            'subscription.priceAndPaymentDetailsComeFromYourSubscriptionProvider',
          )}
        </AppText>
      </View>
      <Notice icon="shield">
        {t('subscription.yourTablesTeamAndOrdersRemainReadyToContinue')}
      </Notice>
    </Screen>
  );
}
export function PurchaseSuccessScreen({
  navigation,
}: RootScreenProps<'PurchaseSuccess'>) {
  const { t } = useTranslation();
  return (
    <Screen header={<AppHeader title={t('subscription.yourSubscription')} />}>
      <SuccessState
        title={t('subscription.backInFullFlow')}
        description={t(
          'subscription.yourDemoSubscriptionIsActiveYourRestaurantIsReady',
        )}
      >
        <AppButton style={styles.button} onPress={() => navigation.popToTop()}>
          {t('subscription.continueToDashboard')}
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
