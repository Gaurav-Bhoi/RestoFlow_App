import React, { useEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function ModalSurface({
  visible,
  onClose,
  centered,
  children,
}: React.PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  centered?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);
  const safePadding = {
    paddingTop: insets.top + 12,
    paddingBottom: centered ? insets.bottom + 16 : 0,
    paddingLeft: insets.left + (centered ? 22 : 0),
    paddingRight: insets.right + (centered ? 22 : 0),
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.overlay, centered && styles.centered, safePadding]}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#22352d55',
  },
  centered: { justifyContent: 'center' },
});
