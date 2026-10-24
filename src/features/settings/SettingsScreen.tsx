import { useTranslation } from 'react-i18next';
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
import { useLanguage } from '../../localization/LocalizationProvider';
import { BUNDLED_LANGUAGES } from '../../localization/config/bundledLanguages';
import { SettingsRow } from './SettingsRow';

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const { session, signOut } = useSession();
  const { restaurant } = useRestaurant();
  const { daysRemaining } = useSubscription();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const language = useLanguage();
  const currentLanguage =
    language.available.find(option => option.code === language.language) ??
    BUNDLED_LANGUAGES.en;
  const isOwner = session?.role === 'owner';
  return (
    <>
      <Screen
        hasTabs
        header={
          <AppHeader
            title={t('navigation.settings')}
            subtitle={t('settings.yourRestaurantYourWay')}
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
          <View style={styles.accountDetails}>
            <AppText style={styles.name}>{session?.name}</AppText>
            <AppText muted style={styles.restaurant}>
              {restaurant.name}
            </AppText>
            <View style={styles.role}>
              <Badge white>
                {t(isOwner ? 'settings.owner' : 'settings.waiter')}
              </Badge>
            </View>
          </View>
        </View>
        <View style={styles.group}>
          <SettingsRow
            icon="edit"
            title={t('settings.editProfile')}
            subtitle={t('settings.editProfileSubtitle')}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingsRow
            hasDivider
            icon="shield"
            title={t('settings.changePassword')}
            subtitle={t('settings.changePasswordSubtitle')}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsRow
            hasDivider
            icon="language"
            title={t('settings.language')}
            subtitle={currentLanguage.nativeName}
            onPress={() => navigation.navigate('Language')}
          />
          {isOwner && (
            <>
              <SettingsRow
                hasDivider
                icon="people"
                title={t('settings.waiterTeam')}
                subtitle={t('settings.valueTeamMembers', {
                  value0: restaurant.waiters.length,
                })}
                onPress={() => navigation.navigate('Waiters')}
              />
              <SettingsRow
                hasDivider
                icon="crown"
                title={t('settings.subscription')}
                subtitle={
                  restaurant.isPremium
                    ? t('settings.premiumActive')
                    : t('settings.freeTrialValueDaysLeft', {
                        value0: daysRemaining,
                      })
                }
                onPress={() => navigation.navigate('Subscription')}
              />
            </>
          )}
        </View>
        <View style={styles.group}>
          <SettingsRow
            icon="logout"
            title={t('settings.logOut')}
            subtitle={t('settings.endThisSession')}
            danger
            onPress={() => setIsLogoutOpen(true)}
          />
        </View>
        <AppText muted style={styles.note}>
          {t('settings.aLittleLessAdminALittleMoreHospitality')}
        </AppText>
        <AppText muted style={styles.version}>
          {t('settings.restoflowRestaurantWorkspace')}
        </AppText>
      </Screen>
      <ConfirmationSheet
        visible={isLogoutOpen}
        title={t('settings.leavingForNow')}
        description={t('settings.yourRestaurantDataStaysSavedYouCanSignBack')}
        icon="logout"
        danger
        confirmLabel={t('settings.logOut')}
        cancelLabel={t('settings.stayHere')}
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
  accountDetails: { flex: 1 },
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
