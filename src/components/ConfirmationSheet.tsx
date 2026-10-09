import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, motion } from '../theme/tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Icon, type IconName } from './Icon';

interface ConfirmationSheetProps {
  visible: boolean;
  title: string;
  description: string;
  icon?: IconName;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss?: () => void;
  isBlocking?: boolean;
  danger?: boolean;
}
export function ConfirmationSheet({
  visible,
  title,
  description,
  icon = 'info',
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onDismiss,
  isBlocking,
  danger,
}: ConfirmationSheetProps) {
  const insets = useSafeAreaInsets();
  const isReducedMotion = useReducedMotion();
  const handleDismiss = onDismiss ?? onCancel;
  const [isPresented, setIsPresented] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(420);
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      setIsPresented(true);
    }
    const duration = isReducedMotion
      ? 0
      : motion[visible ? 'sheet_entrance' : 'sheet_dismissal'];
    const animation = Animated.timing(entrance, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setIsPresented(false);
      }
    });
    return () => animation.stop();
  }, [visible, isReducedMotion, entrance]);
  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="none"
      onRequestClose={isBlocking ? () => {} : handleDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.shade, { opacity: entrance }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isBlocking ? undefined : handleDismiss}
          accessible={false}
        />
        <Animated.View
          accessibilityViewIsModal
          onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 36),
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [sheetHeight, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={[styles.icon, danger && styles.danger]}>
            <Icon
              name={icon}
              size={25}
              color={danger ? colors.error : colors.forest}
            />
          </View>
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
          <AppText muted style={styles.copy}>
            {description}
          </AppText>
          <AppButton onPress={onConfirm}>{confirmLabel}</AppButton>
          {!!cancelLabel && (
            <AppButton
              variant={isBlocking ? 'ghost' : 'secondary'}
              onPress={onCancel}
              style={styles.cancel}
            >
              {cancelLabel}
            </AppButton>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  shade: { flex: 1, backgroundColor: '#172e2466', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 27,
    paddingTop: 12,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 10,
    backgroundColor: '#d0d8cc',
    alignSelf: 'center',
    marginBottom: 25,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  danger: { backgroundColor: colors.dangerSoft },
  copy: { fontSize: 13, lineHeight: 23, marginTop: 13, marginBottom: 25 },
  cancel: { marginTop: 10 },
});
