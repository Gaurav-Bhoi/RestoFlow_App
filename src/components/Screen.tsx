import React, { useCallback, useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type KeyboardEvent,
  type KeyboardMetrics,
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
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
}
export function Screen({
  header,
  footer,
  hasTabs,
  contentMaxWidth = contentWidths.screen,
  contentStyle,
  refreshing = false,
  onRefresh,
  scrollable = true,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { frameWidth, pagePadding } = useResponsiveLayout(contentMaxWidth);
  const scroll = useRef<ScrollViewInstance>(null);
  const focused = useRef<TextInputInstance | null>(null);
  const scrollOffset = useRef(0);
  const keyboardFrame = useRef<KeyboardMetrics | undefined>(Keyboard.metrics());
  const revealFrame = useRef<number | null>(null);
  const bottomObstruction = hasTabs
    ? insets.bottom + navigationLayout.height + navigationLayout.bottomGap
    : 0;
  const revealFocusedInput = useCallback(() => {
    const input = focused.current;
    const scroller = scroll.current;
    if (!scroller || !input?.isFocused()) return;
    // The viewport accounts for fixed headers/footers; the keyboard frame
    // also protects the field while the native resize is still settling.
    scroller.measureInWindow((_x, viewportY, _width, viewportHeight) => {
      input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
        // Native measurements can finish after focus or navigation changes.
        if (
          focused.current !== input ||
          scroll.current !== scroller ||
          !input.isFocused() ||
          viewportHeight <= 0 ||
          inputHeight <= 0
        )
          return;
        const visibleTop = viewportY + 12;
        const visibleBottom =
          Math.min(
            viewportY + viewportHeight - bottomObstruction,
            keyboardFrame.current?.screenY ?? Infinity,
          ) - 12;
        if (visibleBottom <= visibleTop) return;
        const delta =
          inputY < visibleTop || inputHeight > visibleBottom - visibleTop
            ? inputY - visibleTop
            : Math.max(0, inputY + inputHeight - visibleBottom);
        if (Math.abs(delta) > 1)
          scroller.scrollTo({
            y: Math.max(0, scrollOffset.current + delta),
            animated: true,
          });
      });
    });
  }, [bottomObstruction]);
  const scheduleReveal = useCallback(() => {
    if (revealFrame.current !== null) cancelAnimationFrame(revealFrame.current);
    revealFrame.current = requestAnimationFrame(() => {
      revealFrame.current = null;
      revealFocusedInput();
    });
  }, [revealFocusedInput]);
  const scrollToInput = useCallback(
    (input: TextInputInstance) => {
      focused.current = input;
      scheduleReveal();
    },
    [scheduleReveal],
  );
  useEffect(() => {
    const keyboardChanged = (event: KeyboardEvent) => {
      keyboardFrame.current = event.endCoordinates;
      scheduleReveal();
    };
    const keyboardHidden = () => {
      keyboardFrame.current = undefined;
    };
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', keyboardChanged),
      Keyboard.addListener('keyboardDidHide', keyboardHidden),
      ...(Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillShow', keyboardChanged),
            Keyboard.addListener('keyboardWillChangeFrame', keyboardChanged),
            Keyboard.addListener('keyboardDidChangeFrame', keyboardChanged),
            Keyboard.addListener('keyboardWillHide', keyboardHidden),
          ]
        : []),
    ];
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
      if (revealFrame.current !== null) {
        cancelAnimationFrame(revealFrame.current);
        revealFrame.current = null;
      }
    };
  }, [scheduleReveal]);
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
      {!scrollable ? (
        <View
          style={[
            styles.content,
            styles.scroll,
            styles.centered,
            {
              width: frameWidth,
              paddingHorizontal: pagePadding,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      ) : (
        <ScrollView
          ref={scroll}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.forest}
                colors={[colors.forest]}
              />
            ) : undefined
          }
          onScroll={event => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onLayout={scheduleReveal}
          onContentSizeChange={scheduleReveal}
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
      )}
      {footer && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
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
  centered: { alignSelf: 'center' },
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
