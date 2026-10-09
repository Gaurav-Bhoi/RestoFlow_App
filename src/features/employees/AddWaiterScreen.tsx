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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { photo, selectPhoto } = useProfilePhoto();
  const { error, addWaiter } = useWaiters();
  const showFeedback = useFeedback();
  const handleAddWaiter = () => {
    if (addWaiter(name, phone, photo)) {
      navigation.goBack();
      showFeedback(`${name.trim()} added to your team`);
    }
  };
  return (
    <Screen
      header={
        <AppHeader
          title="Welcome to the team"
          subtitle="Add a waiter to your restaurant."
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
            Cancel
          </AppButton>
          <AppButton onPress={handleAddWaiter} style={styles.submit}>
            Add waiter
          </AppButton>
        </View>
      }
    >
      <PhotoPicker photo={photo} onPress={selectPhoto} />
      <AppInput
        label="Waiter name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Sneha"
      />
      <AppInput
        label="Mobile number"
        isPhone
        value={phone}
        onChangeText={value => setPhone(normalizePhone(value))}
        placeholder="10-digit mobile number"
      />
      <Notice>
        This number gives the waiter access to tables and orders, without owner
        management controls.
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
