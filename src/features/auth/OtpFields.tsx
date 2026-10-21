import { useTranslation } from 'react-i18next';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppText } from '../../components/AppText';
import { KeyboardScrollContext } from '../../components/KeyboardScrollContext';
import { colors, controlSizes, fonts } from '../../theme/tokens';
import type { OtpChallenge } from '../../api/types';

const OTP_LENGTH = 6;
const splitCode = (value: string) =>
  Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

export type PendingOtp = OtpChallenge & { requestedAt: number };
export function OtpFields({
  challenge,
  value,
  onChange,
  onResend,
  busy,
}: {
  challenge: PendingOtp;
  value: string;
  onChange: (value: string) => void;
  onResend: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const [digits, setDigits] = useState(() => splitCode(value));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputs = useRef<(TextInputInstance | null)[]>([]);
  const scrollToInput = useContext(KeyboardScrollContext);
  useEffect(() => {
    // Keep empty boxes in place when the parent echoes the edited code.
    setDigits(current =>
      current.join('') === value ? current : splitCode(value),
    );
  }, [value]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(
    0,
    Math.ceil(
      (challenge.requestedAt + challenge.resendAfter * 1000 - now) / 1000,
    ),
  );
  const updateDigits = (next: string[]) => {
    setDigits(next);
    onChange(next.join(''));
  };
  const changeDigit = (index: number, text: string) => {
    if (busy) return;
    const entered = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (text && !entered) return;
    const next = [...digits];
    if (!entered) {
      next[index] = '';
      updateDigits(next);
      inputs.current[Math.max(0, index - 1)]?.focus();
      return;
    }
    // A complete pasted or autofilled code always fills all six boxes.
    const start = entered.length === OTP_LENGTH ? 0 : index;
    entered.split('').forEach((digit, offset) => {
      if (start + offset < OTP_LENGTH) next[start + offset] = digit;
    });
    updateDigits(next);
    inputs.current[Math.min(start + entered.length, OTP_LENGTH - 1)]?.focus();
  };
  return (
    <View>
      <AppText muted variant="small">
        {challenge.mockCode
          ? t('api.mockCode', { code: challenge.mockCode })
          : t('api.enterCode')}
      </AppText>
      <AppText variant="label" style={styles.label}>
        {t('api.verificationCode')}
      </AppText>
      <View style={styles.boxes}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={input => {
              inputs.current[index] = input;
            }}
            accessibilityLabel={`${t('api.verificationCode')}, ${
              index + 1
            }/${OTP_LENGTH}`}
            value={digit}
            onChangeText={text => changeDigit(index, text)}
            onKeyPress={({ nativeEvent }) => {
              if (
                busy ||
                nativeEvent.key !== 'Backspace' ||
                digit ||
                index === 0
              )
                return;
              const next = [...digits];
              next[index - 1] = '';
              updateDigits(next);
              inputs.current[index - 1]?.focus();
            }}
            onFocus={() => {
              setFocusedIndex(index);
              const input = inputs.current[index];
              if (input) scrollToInput?.(input);
            }}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            importantForAutofill={index === 0 ? 'yes' : 'no'}
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            autoCorrect={false}
            editable={!busy}
            selectionColor={colors.forest}
            maxFontSizeMultiplier={1.5}
            style={[
              styles.box,
              focusedIndex === index && styles.focused,
              busy && styles.disabled,
            ]}
          />
        ))}
      </View>
      <AppButton
        variant="ghost"
        onPress={onResend}
        disabled={busy || seconds > 0}
      >
        {seconds > 0 ? t('api.resendCodeIn', { seconds }) : t('api.resendCode')}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 9 },
  boxes: { flexDirection: 'row', gap: 8, marginBottom: 21 },
  box: {
    flex: 1,
    minWidth: 0,
    height: controlSizes.input,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 22,
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  focused: { borderColor: colors.forest },
  disabled: { opacity: 0.45 },
});
