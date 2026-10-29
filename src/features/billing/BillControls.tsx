import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme/tokens';

export function BillIconButton({
  icon,
  label,
  onPress,
  disabled,
  busy,
  plain,
}: {
  icon?: IconName | 'more' | 'save';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  plain?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        !plain && styles.filled,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.forest} />
      ) : icon === 'more' ? (
        <AppText style={styles.more}>•••</AppText>
      ) : icon === 'save' ? (
        <View style={styles.checks}>
          <Icon name="check" size={20} />
          <View style={styles.secondCheck}>
            <Icon name="check" size={20} />
          </View>
        </View>
      ) : (
        <Icon name={icon ?? 'check'} size={20} />
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filled: { backgroundColor: colors.sage },
  dimmed: { opacity: 0.45 },
  more: { color: colors.forest, fontSize: 13, letterSpacing: 1 },
  checks: { width: 24, height: 20 },
  secondCheck: { position: 'absolute', left: 6, top: 0 },
});
