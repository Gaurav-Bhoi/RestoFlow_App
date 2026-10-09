import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, motion } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface AppButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  iconPosition?: 'before' | 'after';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
export function AppButton({
  children,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'before',
  disabled,
  style,
  testID,
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isReducedMotion = useReducedMotion();
  const color =
    variant === 'secondary' || variant === 'ghost'
      ? colors.forest
      : colors.white;
  const animatePress = (value: number) =>
    Animated.timing(scale, {
      toValue: value,
      duration: isReducedMotion ? 0 : motion.press,
      useNativeDriver: true,
    }).start();
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        testID={testID}
        style={[styles.button, styles[variant], disabled && styles.disabled]}
      >
        {icon && iconPosition === 'before' && (
          <Icon name={icon} color={color} size={18} />
        )}
        <AppText style={[styles.label, { color }]}>{children}</AppText>
        {icon && iconPosition === 'after' && (
          <Icon name={icon} color={color} size={18} />
        )}
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 28,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: colors.forest },
  secondary: { backgroundColor: colors.sage },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  label: { fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
