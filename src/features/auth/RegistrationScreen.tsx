import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Notice } from '../../components/Notice';
import { PhotoPicker } from '../../components/PhotoPicker';
import { Screen } from '../../components/Screen';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';
import { colors, contentWidths } from '../../theme/tokens';
import { useAuth } from './useAuth';
import { normalizePhone } from './validation';

export function RegistrationScreen({
  route,
  navigation,
}: RootScreenProps<'Registration'>) {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState(route.params.phone);
  const [error, setError] = useState('');
  const { photo, selectPhoto } = useProfilePhoto();
  const { register } = useAuth();
  const showFeedback = useFeedback();
  const ownerInput = useRef<TextInputInstance>(null);
  const phoneInput = useRef<TextInputInstance>(null);
  const handleRegister = () => {
    try {
      register(restaurantName, ownerName, phone, photo);
      Keyboard.dismiss();
      showFeedback(t('auth.yourRestaurantIsReadyAddYourFirstTable'));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t('auth.pleaseTryAgain'),
      );
    }
  };
  return (
    <Screen
      contentMaxWidth={contentWidths.form}
      header={
        <AppHeader
          maxWidth={contentWidths.form}
          title={t('auth.welcomeAboard')}
          subtitle={t('auth.aFewDetailsThenYouReReady')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <View style={styles.actions}>
          <AppButton
            variant="secondary"
            onPress={navigation.goBack}
            style={styles.cancel}
          >
            {t('auth.cancel')}
          </AppButton>
          <AppButton onPress={handleRegister} style={styles.submit}>
            {t('auth.createAccount')}
          </AppButton>
        </View>
      }
    >
      <PhotoPicker photo={photo} onPress={selectPhoto} />
      <AppInput
        label={t('auth.restaurantName')}
        value={restaurantName}
        onChangeText={setRestaurantName}
        autoCapitalize="words"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => ownerInput.current?.focus()}
        placeholder={t('auth.eGSaffronKitchen')}
      />
      <AppInput
        ref={ownerInput}
        label={t('auth.yourName')}
        value={ownerName}
        onChangeText={setOwnerName}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => phoneInput.current?.focus()}
        placeholder={t('auth.restaurantOwner')}
      />
      <AppInput
        ref={phoneInput}
        label={t('auth.mobileNumber')}
        isPhone
        value={phone}
        onChangeText={value => setPhone(normalizePhone(value))}
        returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      <Notice assetIcon="leaf">
        {t('auth.yourFirst15DaysAreOnUsStartWith')}
      </Notice>
      {!!error && (
        <AppText accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cancel: { width: 115 },
  submit: { flex: 1 },
  error: { fontSize: 12, color: colors.error, marginTop: 12 },
});
