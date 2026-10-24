import React, { useContext, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import { KeyboardScrollContext } from './KeyboardScrollContext';

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const input = useRef<TextInputInstance>(null);
  const scrollToInput = useContext(KeyboardScrollContext);
  const revealInput = () => {
    if (input.current) scrollToInput?.(input.current);
  };
  return (
    <View style={styles.search}>
      <Icon name="search" size={18} color={colors.muted} />
      <TextInput
        ref={input}
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        onFocus={revealInput}
        onPressIn={revealInput}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  search: {
    minHeight: 49,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 26,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
