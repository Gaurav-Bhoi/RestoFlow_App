import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { FoodTypeMark } from '../../components/FoodTypeMark';
import { colors } from '../../theme/tokens';
import type { Dish } from '../restaurant/types';

export function FoodTypeSelector({
  value,
  onChange,
  disabled,
}: {
  value: Dish['foodType'];
  onChange: (type: Dish['foodType']) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.group}>
      <AppText variant="label" muted style={styles.label}>
        {t('menu.foodType')}
      </AppText>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {(['VEG', 'NON_VEG'] as const).map(type => (
          <Pressable
            key={type}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === type, disabled }}
            disabled={disabled}
            onPress={() => onChange(type)}
            style={[styles.option, value === type && styles.selected]}
          >
            <FoodTypeMark type={type} />
            <AppText
              style={[styles.text, value === type && styles.selectedText]}
            >
              {t(type === 'VEG' ? 'menu.veg' : 'menu.nonVeg')}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { marginBottom: 21 },
  label: { marginBottom: 9 },
  options: { flexDirection: 'row', gap: 14 },
  option: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: colors.white,
  },
  selected: { backgroundColor: colors.sage },
  text: { color: colors.muted, flexShrink: 1 },
  selectedText: { color: colors.forest },
});
