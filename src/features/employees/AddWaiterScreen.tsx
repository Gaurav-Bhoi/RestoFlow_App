import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { RootScreenProps } from '../../app/navigationTypes';
import { useFeedback } from '../../app/FeedbackProvider';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { Notice } from '../../components/Notice';
import { PhotoPicker } from '../../components/PhotoPicker';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';
import { colors, layout } from '../../theme/tokens';
import { normalizePhone } from '../auth/validation';
import { useWaiters } from './useWaiters';

export function AddWaiterScreen({ navigation }: RootScreenProps<'AddWaiter'>) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { photo, selectPhoto } = useProfilePhoto();
  const { error, addWaiter } = useWaiters();
  const showFeedback = useFeedback();
  const handleAddWaiter = () => {
    if (addWaiter(name, phone, photo)) {
      navigation.goBack();
      showFeedback(
        t('employees.valueAddedToYourTeam', { value0: name.trim() }),
      );
    }
  };
  return (
    <Screen
      header={
        <AppHeader
          title={t('employees.welcomeToTheTeam')}
          subtitle={t('employees.addAWaiterToYourRestaurant')}
          onBack={navigation.goBack}
        />
      }
      footer={
        <View style={layout.row}>
          <AppButton
            variant="secondary"
            onPress={navigation.goBack}
            style={styles.cancel}
          >
            {t('employees.cancel')}
          </AppButton>
          <AppButton onPress={handleAddWaiter} style={styles.submit}>
            {t('employees.addWaiter')}
          </AppButton>
        </View>
      }
    >
      <PhotoPicker photo={photo} onPress={selectPhoto} />
      <AppInput
        label={t('employees.waiterName')}
        value={name}
        onChangeText={setName}
        placeholder={t('employees.eGSneha')}
      />
      <AppInput
        label={t('employees.mobileNumber')}
        isPhone
        value={phone}
        onChangeText={value => setPhone(normalizePhone(value))}
        placeholder={t('employees.10DigitMobileNumber')}
      />
      <Notice>
        {t('employees.thisNumberGivesTheWaiterAccessToTablesAnd')}
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
  cancel: { width: 115 },
  submit: { flex: 1 },
  error: { color: colors.error, fontSize: 12, marginTop: 12 },
});
