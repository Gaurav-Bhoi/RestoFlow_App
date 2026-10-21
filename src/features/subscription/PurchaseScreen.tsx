import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import type { RootScreenProps } from '../../app/navigationTypes';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Notice } from '../../components/Notice';
import { useSubscription } from './useSubscription';
import { useSession } from '../auth/SessionProvider';
import { normalizeApiError } from '../../api/errors';
export function PurchaseScreen({ navigation }: RootScreenProps<'Purchase'>) {
  const { t } = useTranslation();
  const { checkActivation } = useSubscription();
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const check = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (await checkActivation()) navigation.popToTop();
      else setMessage(t('api.activationPending'));
    } catch (error) {
      setMessage(normalizeApiError(error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      header={
        <AppHeader
          title={t('api.subscriptionAccess')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <AppButton onPress={check} loading={busy}>
          {t('api.checkActivation')}
        </AppButton>
      }
    >
      <Notice icon="shield">{t('api.contactAdministrator')}</Notice>
      {!!message && <AppText accessibilityRole="alert">{message}</AppText>}
      <AppButton variant="secondary" onPress={signOut}>
        {t('api.signOut')}
      </AppButton>
    </Screen>
  );
}
