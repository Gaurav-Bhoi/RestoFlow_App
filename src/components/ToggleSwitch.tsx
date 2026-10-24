import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

export function ToggleSwitch({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      onPress={() => onChange(!value)}
      disabled={disabled}
      style={[styles.touch, disabled && styles.disabled]}
    >
      <View style={[styles.track, value && styles.active]}>
        <View style={[styles.thumb, value && styles.thumbActive]} />
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  touch: { minWidth: 54, minHeight: 44, justifyContent: 'center' },
  track: {
    width: 54,
    height: 30,
    borderRadius: 15,
    padding: 3,
    backgroundColor: colors.sage,
  },
  active: { backgroundColor: colors.forest },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  thumbActive: { alignSelf: 'flex-end' },
  disabled: { opacity: 0.5 },
});
