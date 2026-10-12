import React, { useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, controlSizes, motion } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { FigmaAsset, type FigmaAssetName } from './FigmaAsset';

interface AppButtonProps {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  assetIcon?: FigmaAssetName;
  iconPosition?: 'before' | 'after';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
export function AppButton({
  children,
  onPress,
  variant = 'primary',
  icon,
  assetIcon,
  iconPosition = 'before',
  disabled,
  loading = false,
  style,
  testID,
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isReducedMotion = useReducedMotion();
  const isDisabled = !!disabled || loading;
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
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        testID={testID}
        style={({ pressed }) => [
          styles.button,
          styles[variant],
          pressed && styles.pressed,
          isDisabled && styles.disabled,
        ]}
      >
        {loading && <ActivityIndicator size="small" color={color} />}
        {!loading && assetIcon && iconPosition === 'before' && (
          <FigmaAsset name={assetIcon} />
        )}
        {!loading && !assetIcon && icon && iconPosition === 'before' && (
          <Icon name={icon} color={color} size={19} />
        )}
        <AppText
          variant="button"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.label, { color }]}
        >
          {children}
        </AppText>
        {!loading && assetIcon && iconPosition === 'after' && (
          <FigmaAsset name={assetIcon} />
        )}
        {!loading && !assetIcon && icon && iconPosition === 'after' && (
          <Icon name={icon} color={color} size={19} />
        )}
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: controlSizes.button,
    borderRadius: controlSizes.button / 2,
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
  label: { flexShrink: 1 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
});
