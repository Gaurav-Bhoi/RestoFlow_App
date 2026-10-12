import React, { useCallback, useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidths, navigationLayout } from '../theme/tokens';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { KeyboardScrollContext } from './KeyboardScrollContext';

interface ScreenProps extends React.PropsWithChildren {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hasTabs?: boolean;
  contentMaxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
}
export function Screen({
  header,
  footer,
  hasTabs,
  contentMaxWidth = contentWidths.screen,
  contentStyle,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { frameWidth, pagePadding } = useResponsiveLayout(contentMaxWidth);
  const scroll = useRef<ScrollViewInstance>(null);
  const focused = useRef<TextInputInstance | null>(null);
  const footerHeight = useRef(0);
  const scrollToInput = useCallback((input: TextInputInstance) => {
    focused.current = input;
    if (Keyboard.isVisible()) {
      scroll.current?.scrollResponderScrollNativeHandleToKeyboard(
        input,
        12 + footerHeight.current,
        true,
      );
    }
  }, []);
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      const focusedInput = TextInput.State.currentlyFocusedInput();
      if (focusedInput && focusedInput === focused.current) {
        scroll.current?.scrollResponderScrollNativeHandleToKeyboard(
          focusedInput,
          12 + footerHeight.current,
          true,
        );
      }
    });
    return () => subscription.remove();
  }, []);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {header}
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              insets.bottom +
              (hasTabs
                ? navigationLayout.height + navigationLayout.bottomGap + 24
                : 36),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            { width: frameWidth, paddingHorizontal: pagePadding },
            contentStyle,
          ]}
        >
          <KeyboardScrollContext.Provider value={scrollToInput}>
            {children}
          </KeyboardScrollContext.Provider>
        </View>
      </ScrollView>
      {footer && (
        <View
          onLayout={event => {
            footerHeight.current = event.nativeEvent.layout.height;
          }}
          style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}
        >
          <View
            style={[
              styles.footerContent,
              { width: frameWidth, paddingHorizontal: pagePadding },
            ]}
          >
            {footer}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', flexGrow: 1 },
  content: { paddingTop: 8 },
  footerContent: { alignSelf: 'center' },
  footer: {
    paddingTop: 16,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
