import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { Notice } from '../../components/Notice';
import { colors, layout } from '../../theme/tokens';
import { formatDate } from '../../utils/date';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { PlanCard } from './PlanCard';
import { useSubscription } from './useSubscription';

export function SubscriptionScreen({
  navigation,
}: RootScreenProps<'Subscription'>) {
  const { restaurant } = useRestaurant();
  const { daysRemaining, isExpired, progress } = useSubscription();
  const details = [
    { label: 'Plan status', value: isExpired ? 'Expired' : 'Active' },
    { label: 'Start date', value: formatDate(restaurant.trialStartedAt) },
    {
      label: restaurant.isPremium ? 'Renewal details' : 'Trial ends',
      value: restaurant.isPremium
        ? 'As per your plan'
        : formatDate(restaurant.trialEndsAt),
    },
  ];
  return (
    <Screen
      header={
        <AppHeader
          title="Your subscription"
          subtitle="A clear view of your plan."
          onBack={navigation.goBack}
        />
      }
    >
      <PlanCard
        isPremium={restaurant.isPremium}
        daysRemaining={daysRemaining}
        progress={progress}
      />
      <View style={styles.details}>
        {details.map(detail => (
          <View key={detail.label} style={[layout.row, styles.row]}>
            <AppText muted variant="small">
              {detail.label}
            </AppText>
            <AppText style={styles.value}>{detail.value}</AppText>
          </View>
        ))}
      </View>
      <Notice icon="shield">
        {restaurant.isPremium
          ? 'Your plan details are linked to your restaurant account.'
          : 'Enjoy every ordering and billing feature during your trial.'}
      </Notice>
    </Screen>
  );
}
const styles = StyleSheet.create({
  details: { marginVertical: 27 },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  value: { fontSize: 12, fontWeight: '700' },
});
