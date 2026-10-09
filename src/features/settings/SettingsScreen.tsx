import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppNavigation } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { ConfirmationSheet } from '../../components/ConfirmationSheet';
import { colors } from '../../theme/tokens';
import { useSession } from '../auth/SessionProvider';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { useSubscription } from '../subscription/useSubscription';
import { useTranslations } from './translations';
import { SettingsRow } from './SettingsRow';

export function SettingsScreen() {
  const navigation = useAppNavigation();
  const { session, signOut } = useSession();
  const { restaurant } = useRestaurant();
  const { daysRemaining } = useSubscription();
  const labels = useTranslations();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const isOwner = session?.role === 'owner';
  return (
    <>
      <Screen
        hasTabs
        header={
          <AppHeader
            title={labels.Settings}
            subtitle="Your restaurant, your way."
          />
        }
      >
        <View style={styles.account}>
          <Avatar
            name={session?.name ?? ''}
            photo={session?.photo}
            size={53}
            dark
          />
          <View>
            <AppText style={styles.name}>{session?.name}</AppText>
            <AppText muted style={styles.restaurant}>
              {restaurant.name}
            </AppText>
            <View style={styles.role}>
              <Badge white>Restaurant {session?.role}</Badge>
            </View>
          </View>
        </View>
        <View style={styles.group}>
          <SettingsRow
            icon="language"
            title="Language"
            subtitle={restaurant.language}
            onPress={() => navigation.navigate('Language')}
          />
          {isOwner && (
            <>
              <SettingsRow
                hasDivider
                icon="people"
                title="Waiter team"
                subtitle={`${restaurant.waiters.length} team members`}
                onPress={() => navigation.navigate('Waiters')}
              />
              <SettingsRow
                hasDivider
                icon="crown"
                title="Subscription"
                subtitle={
                  restaurant.isPremium
                    ? 'Premium · Active'
                    : `Free trial · ${daysRemaining} days left`
                }
                onPress={() => navigation.navigate('Subscription')}
              />
            </>
          )}
        </View>
        <View style={styles.group}>
          <SettingsRow
            icon="logout"
            title="Log out"
            subtitle="End this session"
            danger
            onPress={() => setIsLogoutOpen(true)}
          />
        </View>
        <AppText muted style={styles.note}>
          A little less admin. A little more hospitality.
        </AppText>
        <AppText muted style={styles.version}>
          RestoFlow · Restaurant workspace
        </AppText>
      </Screen>
      <ConfirmationSheet
        visible={isLogoutOpen}
        title="Leaving for now?"
        description="Your restaurant data stays saved. You can sign back in with your mobile number."
        icon="logout"
        danger
        confirmLabel="Log out"
        cancelLabel="Stay here"
        onConfirm={signOut}
        onCancel={() => setIsLogoutOpen(false)}
      />
    </>
  );
}
const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 22,
    borderRadius: 27,
    backgroundColor: colors.sage,
    marginBottom: 23,
  },
  name: { fontSize: 16, fontWeight: '700' },
  restaurant: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  role: { marginTop: 8 },
  group: {
    backgroundColor: colors.white,
    borderRadius: 27,
    overflow: 'hidden',
    marginBottom: 20,
  },
  note: { fontSize: 10, textAlign: 'center', marginTop: 8 },
  version: { fontSize: 10, textAlign: 'center', marginTop: 28 },
});
