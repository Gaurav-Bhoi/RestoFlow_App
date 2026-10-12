import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors, layout } from '../../theme/tokens';

export function PlanCard({
  isPremium,
  daysRemaining,
  progress,
  isPurchase,
}: {
  isPremium: boolean;
  daysRemaining: number;
  progress: number;
  isPurchase?: boolean;
}) {
  const { t } = useTranslation();
  const title =
    isPremium || isPurchase
      ? t('subscription.premiumPlan')
      : t('subscription.aGreatStart');
  let description = t('subscription.15DaysToMakeYourselfAtHome');
  if (isPremium) {
    description = t('subscription.yourRestaurantInFullFlow');
  }
  if (isPurchase) {
    description = t('subscription.everythingYouNeedForACalmerService');
  }
  return (
    <View style={styles.plan}>
      <View style={layout.row}>
        <View style={styles.icon}>
          <Icon name="crown" color={colors.white} size={23} />
        </View>
        {!isPurchase && (
          <AppText style={styles.badge}>
            •{' '}
            {daysRemaining || isPremium
              ? t('subscription.active')
              : t('subscription.expired')}
          </AppText>
        )}
      </View>
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      <AppText style={styles.copy}>{description}</AppText>
      {isPurchase && (
        <View style={styles.features}>
          {[
            'Table & customer management',
            'Independent orders & bills',
            'Waiter team & receipt printing',
          ].map(feature => (
            <View key={feature} style={styles.feature}>
              <Icon name="check" color={colors.white} size={18} />
              <AppText style={styles.featureText}>{feature}</AppText>
            </View>
          ))}
        </View>
      )}
      {!isPurchase && isPremium && (
        <AppText style={styles.premiumDetails}>
          {t('subscription.orderingBillingYourFloorTeam')}
        </AppText>
      )}
      {!isPurchase && !isPremium && (
        <>
          <View style={styles.track}>
            <View style={[styles.progress, { width: `${progress * 100}%` }]} />
          </View>
          <View style={[layout.row, styles.remaining]}>
            <AppText style={styles.remainingLabel}>
              {t('subscription.valueDaysRemaining', { value0: daysRemaining })}
            </AppText>
            <AppText style={styles.remainingLabel}>
              {t('subscription.15DayFreeTrial')}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  plan: {
    backgroundColor: colors.forest,
    borderRadius: 30,
    paddingVertical: 26,
    paddingHorizontal: 24,
  },
  icon: {
    backgroundColor: colors.forestLight,
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e7f0e6',
    borderRadius: 20,
    backgroundColor: colors.forestLight,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  title: { fontSize: 27, color: colors.white, marginVertical: 11 },
  copy: { color: '#d8e5d9', fontSize: 13, marginBottom: 24 },
  track: {
    height: 5,
    borderRadius: 10,
    backgroundColor: colors.forestLight,
    overflow: 'hidden',
  },
  progress: { height: 5, backgroundColor: '#c8d9b6', borderRadius: 10 },
  remaining: { marginTop: 12 },
  remainingLabel: { fontSize: 10, color: '#dae6da' },
  premiumDetails: { fontSize: 12, color: '#dae6da' },
  features: { gap: 18 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 12, color: colors.white, flex: 1 },
});
