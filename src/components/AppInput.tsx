import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
  label: string;
  isPhone?: boolean;
  error?: string;
}
export function AppInput({ label, isPhone, error, ...props }: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={styles.group}>
      <AppText style={styles.label}>{label}</AppText>
      <View
        style={[
          styles.field,
          isFocused && styles.focused,
          !!error && styles.invalid,
        ]}
      >
        {isPhone && <AppText style={styles.prefix}>+91</AppText>}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.muted}
          selectionColor={colors.forest}
          style={styles.input}
          keyboardType={isPhone ? 'phone-pad' : 'default'}
          maxLength={isPhone ? 10 : undefined}
          autoComplete={isPhone ? 'tel-national' : 'off'}
          {...props}
          onFocus={event => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={event => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
        />
      </View>
      {!!error && (
        <AppText accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { marginBottom: 21 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 9 },
  field: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focused: { borderColor: colors.forest },
  invalid: { borderColor: colors.error },
  input: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  prefix: {
    color: colors.muted,
    fontSize: 13,
    paddingRight: 13,
    marginRight: 13,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  error: { color: colors.error, fontSize: 12, marginTop: 7 },
});
