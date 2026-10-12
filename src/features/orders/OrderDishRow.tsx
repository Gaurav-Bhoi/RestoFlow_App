import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { DishIllustration } from '../menu/DishIllustration';
import type { Dish } from '../restaurant/types';

export function OrderDishRow({
  dish,
  quantity,
  onChange,
}: {
  dish: Dish;
  quantity: number;
  onChange: (change: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.food}>
        <DishIllustration id={dish.id} />
      </View>
      <View style={styles.info}>
        <AppText style={styles.name}>{dish.name}</AppText>
        <AppText muted style={styles.price}>
          {formatCurrency(dish.price)}
        </AppText>
      </View>
      {quantity > 0 ? (
        <View style={styles.quantity}>
          <Pressable
            onPress={() => onChange(-1)}
            accessibilityRole="button"
            accessibilityLabel={t('orders.removeOneValue', {
              value0: dish.name,
            })}
            style={styles.quantityButton}
          >
            <Icon name="minus" size={16} />
          </Pressable>
          <AppText accessibilityLiveRegion="polite" style={styles.count}>
            {quantity}
          </AppText>
          <Pressable
            onPress={() => onChange(1)}
            accessibilityRole="button"
            accessibilityLabel={t('orders.addOneValue', { value0: dish.name })}
            style={styles.quantityButton}
          >
            <Icon name="plus" size={16} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => onChange(1)}
          accessibilityRole="button"
          accessibilityLabel={t('orders.addValue', { value0: dish.name })}
          style={styles.add}
        >
          <Icon name="plus" size={14} />
          <AppText style={styles.addLabel}>{t('orders.add')}</AppText>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  food: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#eeeadf',
    overflow: 'hidden',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  price: { fontSize: 12, marginTop: 4 },
  quantity: {
    height: 44,
    minWidth: 112,
    borderRadius: 22,
    backgroundColor: colors.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 13,
    color: colors.forest,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  add: {
    height: 44,
    minWidth: 75,
    paddingHorizontal: 13,
    borderRadius: 23,
    backgroundColor: colors.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  addLabel: { color: colors.forest, fontSize: 12, fontWeight: '700' },
});
