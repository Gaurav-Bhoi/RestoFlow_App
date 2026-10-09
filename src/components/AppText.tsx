import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, fonts } from '../theme/tokens';

interface AppTextProps extends TextProps {
  variant?: 'body' | 'heading' | 'section' | 'small' | 'helper';
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
      {...props}
      style={[
        styles.body,
        styles[variant],
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
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 29,
    letterSpacing: -0.8,
  },
  section: {
    fontFamily: fonts.heading,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
    letterSpacing: -0.6,
  },
  small: { fontSize: 12, lineHeight: 19 },
  helper: { fontSize: 11, lineHeight: 17 },
  muted: { color: colors.muted },
  script: { fontFamily: fonts.script },
});
