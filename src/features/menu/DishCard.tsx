import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { FoodTypeMark } from '../../components/FoodTypeMark';
import { colors } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type { Dish } from '../restaurant/types';
import { DishImage } from './DishImage';
import { dishIllustration } from './menuConfig';

export function DishCard({
  dish,
  onMore,
  disabled,
}: {
  dish: Dish;
  onMore?: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.card} testID={`dish-${dish.id}`}>
      <View style={styles.food}>
        <DishImage uri={dish.imageUrl ?? dishIllustration(dish)} />
      </View>
      <View style={styles.titleRow}>
        <AppText style={styles.title}>{dish.name}</AppText>
        {onMore && (
          <Pressable
            onPress={onMore}
            disabled={disabled}
            accessibilityState={{ disabled }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t('menu.moreForDish', { name: dish.name })}
            style={styles.more}
          >
            <View style={styles.dots}>
              {[0, 1, 2].map(dot => (
                <View key={dot} style={styles.dot} />
              ))}
            </View>
          </Pressable>
        )}
      </View>
      <AppText muted style={styles.description}>
        {dish.description || ' '}
      </AppText>
      <View style={styles.priceRow}>
        <AppText style={styles.price}>{formatCurrency(dish.price)}</AppText>
        <FoodTypeMark type={dish.foodType} />
      </View>
      <View
        style={[styles.availability, !dish.available && styles.unavailable]}
      >
        <AppText
          style={[styles.status, !dish.available && styles.unavailableText]}
        >
          {t(dish.available ? 'menu.available' : 'menu.unavailable')}
        </AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 27,
    padding: 12,
    paddingTop: 11,
    paddingBottom: 13,
  },
  food: {
    aspectRatio: 143 / 106,
    marginHorizontal: -1,
    borderRadius: 23,
    backgroundColor: colors.food,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  title: { flex: 1, fontSize: 14, lineHeight: 19.6 },
  more: {
    width: 32,
    minHeight: 44,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 5 }],
  },
  dots: { flexDirection: 'row', gap: 3 },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.forest,
  },
  description: { fontSize: 10, lineHeight: 14, minHeight: 14, marginTop: 5 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  price: { fontSize: 15, lineHeight: 21, color: colors.forest },
  availability: {
    minWidth: 85,
    alignSelf: 'flex-start',
    minHeight: 20,
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.sage,
  },
  status: { fontSize: 10, lineHeight: 14, color: colors.forest },
  unavailable: { backgroundColor: '#faeee6' },
  unavailableText: { color: '#b65435' },
});
