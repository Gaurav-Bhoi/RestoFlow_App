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
import { normalizeApiError } from '../../api/errors';
import { OtpFields, type PendingOtp } from './OtpFields';

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
  const { register, requestRegistration, verifyRegistration } = useAuth();
  const [challenge, setChallenge] = useState<PendingOtp>();
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const showFeedback = useFeedback();
  const ownerInput = useRef<TextInputInstance>(null);
  const phoneInput = useRef<TextInputInstance>(null);
  const requestCode = async () => {
    const requested = await requestRegistration(phone);
    setChallenge({ ...requested, requestedAt: Date.now() });
    setOtp('');
    setToken('');
  };
  const handleRegister = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (restaurantName.trim().length < 2 || ownerName.trim().length < 2)
        throw new Error('Enter your name and restaurant name.');
      if (!challenge) {
        await requestCode();
        return;
      }
      if (!token && !/^\d{6}$/.test(otp))
        throw new Error('Enter the six-digit verification code.');
      const onboardingToken =
        token ||
        (await verifyRegistration(challenge.challengeId, otp)).onboardingToken;
      setToken(onboardingToken);
      await register(onboardingToken, restaurantName, ownerName, photo);
      Keyboard.dismiss();
      showFeedback(t('auth.yourRestaurantIsReadyAddYourFirstTable'));
    } catch (cause) {
      setError(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await requestCode();
      setError('');
    } catch (cause) {
      setError(normalizeApiError(cause).message);
    } finally {
      setBusy(false);
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
          <AppButton
            onPress={handleRegister}
            loading={busy}
            style={styles.submit}
          >
            {challenge ? t('api.verifyCreate') : t('api.sendCode')}
          </AppButton>
        </View>
      }
    >
      <PhotoPicker photo={photo?.uri} onPress={selectPhoto} />
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
        editable={!busy}
        value={phone}
        onChangeText={value => {
          setPhone(normalizePhone(value));
          setChallenge(undefined);
          setToken('');
        }}
        returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      {challenge && (
        <OtpFields
          challenge={challenge}
          value={otp}
          onChange={setOtp}
          onResend={resend}
          busy={busy}
        />
      )}
      <Notice assetIcon="leaf">{t('api.trialNotice')}</Notice>
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
