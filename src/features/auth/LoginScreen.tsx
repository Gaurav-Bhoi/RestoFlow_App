import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { FigmaAsset } from '../../components/FigmaAsset';
import { colors, contentWidths } from '../../theme/tokens';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { RootScreenProps } from '../../app/navigationTypes';
import { normalizePhone } from './validation';
import { useAuth } from './useAuth';
import { normalizeApiError } from '../../api/errors';
import { OtpFields, type PendingOtp } from './OtpFields';

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { checkPhone, login, requestLogin } = useAuth();
  const [challenge, setChallenge] = useState<PendingOtp>();
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const { contentWidth } = useResponsiveLayout(contentWidths.form);
  const artWidth = Math.min(320, contentWidth - 26);
  const [headline, ...headlineRest] = t('auth.serviceMadeSimple').split('\n');
  const requestCode = async () => {
    const requested = await requestLogin(phone);
    setChallenge({ ...requested, requestedAt: Date.now() });
    setOtp('');
  };
  const handleContinue = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (challenge) {
        if (!/^\d{6}$/.test(otp))
          throw new Error('Enter the six-digit verification code.');
        await login(challenge.challengeId, otp);
      } else {
        const { registered } = await checkPhone(phone);
        if (registered) await requestCode();
        else
          navigation.navigate('Registration', { phone: normalizePhone(phone) });
      }
    } catch (cause) {
      const failure = normalizeApiError(cause);
      if (failure.code === 'ACCOUNT_NOT_FOUND') {
        setChallenge(undefined);
        setOtp('');
      }
      setError(failure.message);
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
    <Screen contentMaxWidth={contentWidths.form} contentStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <FigmaAsset name="cutlery-light" />
        </View>
        <AppText variant="brand" numberOfLines={1}>
          {t('auth.restoflow')}
        </AppText>
      </View>
      <View style={[styles.art, { width: artWidth }]}>
        <FigmaAsset name="welcome" width={Math.min(300, artWidth - 20)} />
      </View>
      <View style={styles.title} accessibilityRole="header">
        <AppText variant="welcomeFirst" style={styles.firstLine}>
          {headline}
        </AppText>
        <AppText variant="display" style={styles.secondLine}>
          {headlineRest.join('\n')}
        </AppText>
      </View>
      <AppText muted style={styles.subtitle}>
        {t('auth.aCalmerWayToTakeOrdersManageTablesAnd')}
      </AppText>
      <AppInput
        label={t('auth.yourMobileNumber')}
        isPhone
        editable={!busy}
        value={phone}
        onChangeText={value => {
          setPhone(normalizePhone(value));
          setChallenge(undefined);
          setOtp('');
          setError('');
        }}
        placeholder={t('auth.enter10DigitNumber')}
        error={error}
        showErrorMessage={false}
        returnKeyType="done"
        onSubmitEditing={handleContinue}
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
      <View style={styles.errorSpace}>
        {!!error && (
          <AppText
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            variant="small"
            style={styles.error}
          >
            {error}
          </AppText>
        )}
      </View>
      <AppButton
        assetIcon="arrow-light"
        iconPosition="after"
        onPress={handleContinue}
        loading={busy}
      >
        {challenge ? t('api.verifySignIn') : t('auth.continue')}
      </AppButton>
      <AppText variant="caption" muted style={styles.fine}>
        {t('auth.yourNumberConnectsYouToYourRestaurantNoPasswords')}
      </AppText>
    </Screen>
  );
}
const styles = StyleSheet.create({
  // Preserve the Owner Login frame's measured -4px welcome offset.
  content: { paddingTop: 7, transform: [{ translateX: -4 }] },
  brand: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 28,
    marginBottom: 24,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 320 / 213,
    borderRadius: 100,
    backgroundColor: colors.sage,
    overflow: 'hidden',
    marginBottom: 27,
  },
  title: { alignItems: 'center', marginBottom: 11.406 },
  firstLine: { textAlign: 'center', marginTop: -1.5 },
  secondLine: { textAlign: 'center', marginTop: -11.74, marginBottom: -3.206 },
  subtitle: {
    fontSize: 13,
    lineHeight: 21.45,
    textAlign: 'center',
    marginHorizontal: 20,
    paddingTop: 6,
    marginBottom: 25.56875,
  },
  errorSpace: { minHeight: 18, marginBottom: 7 },
  error: { color: colors.error },
  fine: {
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 17,
    marginHorizontal: 24,
  },
});
