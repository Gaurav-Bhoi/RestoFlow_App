import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
  style,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.filters, style]}
    >
      {options.map(option => (
        <Pressable
          key={option.value}
          onPress={() => onSelect(option.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === selected }}
          style={[styles.chip, option.value === selected && styles.active]}
        >
          <AppText
            style={[
              styles.text,
              option.value === selected && styles.activeText,
            ]}
          >
            {option.label}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  filters: { gap: 7, marginTop: 20, marginBottom: 10 },
  chip: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.white },
  text: { fontSize: 12, color: colors.muted },
  activeText: { fontWeight: '700', color: colors.forest },
});
