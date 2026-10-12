import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, fonts, typography } from '../theme/tokens';

interface AppTextProps extends TextProps {
  variant?: keyof typeof typography;
  muted?: boolean;
}
export function AppText({
  variant = 'body',
  muted,
  style,
  children,
  ...props
}: AppTextProps) {
  const hasDevanagari =
    typeof children === 'string' && /[\u0900-\u097f]/.test(children);
  return (
    <Text
      maxFontSizeMultiplier={1.5}
      {...props}
      style={[
        styles.body,
        typography[variant],
        muted && styles.muted,
        hasDevanagari && styles.script,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontWeight: '400',
    includeFontPadding: false,
    color: colors.ink,
    letterSpacing: 0,
  },
  muted: { color: colors.muted },
  script: { fontFamily: fonts.script },
});
