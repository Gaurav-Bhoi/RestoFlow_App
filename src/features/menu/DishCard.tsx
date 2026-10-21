import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type { Dish } from '../restaurant/types';
import { DishImage } from './DishImage';

export function DishCard({ dish }: { dish: Dish }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.food}>
        <DishImage uri={dish.imageUrl} />
      </View>
      <AppText style={styles.title}>{dish.name}</AppText>
      <AppText muted style={styles.description}>
        {dish.description}
      </AppText>
      <View style={layout.row}>
        <AppText style={styles.price}>{formatCurrency(dish.price)}</AppText>
        {dish.foodType === 'NON_VEG' ? (
          <AppText variant="helper" muted>
            {t('api.nonVegetarian')}
          </AppText>
        ) : (
          <View
            accessible
            accessibilityLabel={t('menu.vegetarian')}
            style={styles.vegetarian}
          >
            <View style={styles.dot} />
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    width: '47.6%',
    backgroundColor: colors.white,
    borderRadius: 27,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 14,
  },
  food: {
    height: 102,
    borderRadius: 23,
    backgroundColor: colors.food,
    overflow: 'hidden',
    padding: 4,
    marginBottom: 12,
  },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: -0.25 },
  description: { fontSize: 10, lineHeight: 15, marginTop: 3, marginBottom: 11 },
  price: { fontSize: 15, fontWeight: '700', color: colors.forest },
  vegetarian: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#557455',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#557455' },
});
