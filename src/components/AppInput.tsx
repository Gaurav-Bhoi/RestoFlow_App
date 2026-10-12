import React, {
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextInputInstance,
} from 'react-native';
import { colors, controlSizes, fonts } from '../theme/tokens';
import { AppText } from './AppText';
import { KeyboardScrollContext } from './KeyboardScrollContext';

interface AppInputProps extends TextInputProps {
  label: string;
  isPhone?: boolean;
  error?: string;
  showErrorMessage?: boolean;
}
export const AppInput = forwardRef<TextInputInstance, AppInputProps>(
  function AppInputField(
    { label, isPhone, error, showErrorMessage = true, style, ...props },
    ref,
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const input = useRef<TextInputInstance | null>(null);
    const scrollToInput = useContext(KeyboardScrollContext);
    const setInputRef = useCallback(
      (instance: TextInputInstance | null) => {
        input.current = instance;
        if (typeof ref === 'function') {
          ref(instance);
        } else if (ref) {
          ref.current = instance;
        }
      },
      [ref],
    );
    return (
      <View style={styles.group}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <View
          style={[
            styles.field,
            isFocused && styles.focused,
            !!error && styles.invalid,
            props.editable === false && styles.disabled,
          ]}
        >
          {isPhone && (
            <View style={styles.prefix}>
              <AppText style={styles.prefixText}>+91</AppText>
            </View>
          )}
          <TextInput
            ref={setInputRef}
            accessibilityLabel={label}
            placeholderTextColor={colors.muted}
            selectionColor={colors.forest}
            keyboardType={isPhone ? 'phone-pad' : 'default'}
            maxLength={isPhone ? 10 : undefined}
            autoComplete={isPhone ? 'tel-national' : 'off'}
            {...props}
            style={[styles.input, style]}
            maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.5}
            onFocus={event => {
              setIsFocused(true);
              if (input.current) scrollToInput?.(input.current);
              props.onFocus?.(event);
            }}
            onBlur={event => {
              setIsFocused(false);
              props.onBlur?.(event);
            }}
          />
        </View>
        {!!error && showErrorMessage && (
          <AppText
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.error}
          >
            {error}
          </AppText>
        )}
      </View>
    );
  },
);
const styles = StyleSheet.create({
  group: { marginBottom: 21 },
  label: { marginBottom: 9 },
  field: {
    minHeight: controlSizes.input,
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
    minWidth: 0,
    minHeight: controlSizes.input - 2,
    paddingVertical: 15.5,
    paddingHorizontal: 0,
    fontSize: 14,
    lineHeight: 21,
    includeFontPadding: false,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  prefix: {
    width: 36.5,
    flexShrink: 0,
    marginRight: 13,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  prefixText: { color: colors.muted, fontSize: 13, lineHeight: 19.5 },
  disabled: { opacity: 0.45 },
  error: { color: colors.error, fontSize: 12, marginTop: 7 },
});
