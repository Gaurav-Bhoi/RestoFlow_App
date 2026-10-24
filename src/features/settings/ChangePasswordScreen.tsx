import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, type TextInputInstance } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { normalizeApiError } from '../../api/errors';
import { AppButton } from '../../components/AppButton';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppText } from '../../components/AppText';
import { Screen } from '../../components/Screen';
import { colors, contentWidths } from '../../theme/tokens';
import { useSession } from '../auth/SessionProvider';
import { isValidPassword } from '../auth/validation';

export function ChangePasswordScreen({
  navigation,
}: RootScreenProps<'ChangePassword'>) {
  const { t } = useTranslation();
  const { changePassword } = useSession();
  const showFeedback = useFeedback();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const newPasswordInput = useRef<TextInputInstance>(null);
  const confirmPasswordInput = useRef<TextInputInstance>(null);
  const handleSave = async () => {
    if (inFlight.current) return;
    setError('');
    if (!oldPassword) {
      setError(t('settings.oldPasswordRequired'));
      return;
    }
    if (!isValidPassword(oldPassword) || !isValidPassword(newPassword)) {
      setError(t('auth.passwordLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      await changePassword({ currentPassword: oldPassword, newPassword });
      Keyboard.dismiss();
      showFeedback(t('settings.passwordUpdated'));
    } catch (cause) {
      const failure = normalizeApiError(cause);
      setError(
        failure.code === 'INVALID_CREDENTIALS'
          ? t('settings.oldPasswordIncorrect')
          : failure.message,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen
      contentMaxWidth={contentWidths.form}
      header={
        <AppHeader
          maxWidth={contentWidths.form}
          title={t('settings.changePassword')}
          subtitle={t('settings.passwordScreenSubtitle')}
          onBack={navigation.goBack}
          backDisabled={busy}
        />
      }
      footer={
        <AppButton loading={busy} onPress={handleSave}>
          {t('settings.updatePassword')}
        </AppButton>
      }
    >
      <AppText muted variant="small" style={styles.description}>
        {t('settings.passwordSignInNotice')}
      </AppText>
      <AppInput
        label={t('settings.oldPassword')}
        placeholder={t('settings.enterOldPassword')}
        value={oldPassword}
        onChangeText={value => {
          setOldPassword(value);
          setError('');
        }}
        editable={!busy}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => newPasswordInput.current?.focus()}
      />
      <AppInput
        ref={newPasswordInput}
        label={t('settings.newPassword')}
        placeholder={t('auth.createPassword')}
        value={newPassword}
        onChangeText={value => {
          setNewPassword(value);
          setError('');
        }}
        editable={!busy}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmPasswordInput.current?.focus()}
      />
      <AppInput
        ref={confirmPasswordInput}
        label={t('auth.confirmPassword')}
        placeholder={t('auth.reenterPassword')}
        value={confirmPassword}
        onChangeText={value => {
          setConfirmPassword(value);
          setError('');
        }}
        editable={!busy}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />
      {!!error && (
        <AppText
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: 8, marginBottom: 24 },
  error: { fontSize: 12, color: colors.error, marginTop: 12 },
});
