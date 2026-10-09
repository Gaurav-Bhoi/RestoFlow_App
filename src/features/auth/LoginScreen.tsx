import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WelcomeArt from '../../../assets/illustrations/welcome.svg';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import type { RootScreenProps } from '../../app/navigationTypes';
import { normalizePhone } from './validation';
import { useAuth } from './useAuth';

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const [phone, setPhone] = useState('9876543210');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const handleContinue = () => {
    setError('');
    try {
      if (!login(phone)) {
        navigation.navigate('Registration', { phone: normalizePhone(phone) });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    }
  };
  return (
    <Screen>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Icon name="cutlery" color={colors.white} />
        </View>
        <AppText variant="heading" style={styles.brandName}>
          RestoFlow
        </AppText>
      </View>
      <View style={styles.art}>
        <View style={styles.illustration}>
          <WelcomeArt
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        </View>
      </View>
      <AppText variant="heading" style={styles.title}>
        Service,{'\n'}made simple.
      </AppText>
      <AppText muted style={styles.subtitle}>
        A calmer way to take orders,{'\n'}manage tables, and finish bills.
      </AppText>
      <AppInput
        label="Your mobile number"
        isPhone
        value={phone}
        onChangeText={value => {
          setPhone(normalizePhone(value));
          setError('');
        }}
        placeholder="Enter 10-digit number"
        error={error}
        onSubmitEditing={handleContinue}
      />
      <View style={styles.errorSpace} />
      <AppButton icon="arrow" iconPosition="after" onPress={handleContinue}>
        Continue
      </AppButton>
      <AppText muted style={styles.fine}>
        Your number connects you to your restaurant.{'\n'}No passwords to
        remember.
      </AppText>
    </Screen>
  );
}
const styles = StyleSheet.create({
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
  brandName: { fontSize: 27, letterSpacing: -1 },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 213,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    backgroundColor: colors.sage,
    overflow: 'hidden',
    marginHorizontal: 13,
    marginBottom: 27,
  },
  illustration: { width: '100%', maxWidth: 300, height: '100%' },
  title: {
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -1.3,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 31,
  },
  errorSpace: { height: 18 },
  fine: {
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 17,
    marginHorizontal: 24,
  },
});
