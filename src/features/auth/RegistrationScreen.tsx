import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { colors, layout } from '../../theme/tokens';
import { useAuth } from './useAuth';
import { normalizePhone } from './validation';

export function RegistrationScreen({
  route,
  navigation,
}: RootScreenProps<'Registration'>) {
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState(route.params.phone);
  const [error, setError] = useState('');
  const { photo, selectPhoto } = useProfilePhoto();
  const { register } = useAuth();
  const showFeedback = useFeedback();
  const handleRegister = () => {
    try {
      register(restaurantName, ownerName, phone, photo);
      showFeedback('Your restaurant is ready. Add your first table.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    }
  };
  return (
    <Screen
      header={
        <AppHeader
          title="Welcome aboard"
          subtitle="A few details, then you’re ready."
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
          <AppButton onPress={handleRegister} style={styles.submit}>
            Create account
          </AppButton>
        </View>
      }
    >
      <PhotoPicker photo={photo} onPress={selectPhoto} />
      <AppInput
        label="Restaurant name"
        value={restaurantName}
        onChangeText={setRestaurantName}
        placeholder="e.g. Saffron Kitchen"
      />
      <AppInput
        label="Your name"
        value={ownerName}
        onChangeText={setOwnerName}
        placeholder="Restaurant owner"
      />
      <AppInput
        label="Mobile number"
        isPhone
        value={phone}
        onChangeText={value => setPhone(normalizePhone(value))}
      />
      <Notice icon="leaf">
        Your first 15 days are on us. Start with your tables and menu.
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
  error: { fontSize: 12, color: colors.error, marginTop: 12 },
});
