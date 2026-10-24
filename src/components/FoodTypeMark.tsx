import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/tokens';

export function FoodTypeMark({ type }: { type: 'VEG' | 'NON_VEG' }) {
  const { t } = useTranslation();
  const nonVeg = type === 'NON_VEG';
  return (
    <View
      accessible
      accessibilityLabel={t(nonVeg ? 'api.nonVegetarian' : 'menu.vegetarian')}
      style={[styles.mark, nonVeg && styles.nonVeg]}
    >
      <View style={nonVeg ? styles.triangle : styles.dot} />
    </View>
  );
}
const styles = StyleSheet.create({
  mark: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonVeg: { borderColor: '#b53636' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.forest },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#b53636',
  },
});
