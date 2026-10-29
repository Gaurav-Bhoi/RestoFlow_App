import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { colors, layout } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import type { CustomerOrder } from '../restaurant/types';

export function CustomerCard({
  order,
  isOwner,
  onPress,
}: {
  order: CustomerOrder;
  isOwner: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const lines = order.items;
  const { contentWidth, fontScale } = useResponsiveLayout();
  const compact = contentWidth < 330 || fontScale > 1.15;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t(
        isOwner ? 'orders.reviewBill' : 'orders.editOrderFor',
        { name: order.name },
      )}
      style={styles.card}
    >
      <View style={[layout.row, compact && styles.compact]}>
        <View style={styles.identity}>
          <Avatar name={order.name} size={40} />
          <View style={styles.name}>
            <AppText style={styles.title}>{order.name}</AppText>
            <AppText muted style={styles.count}>
              {t('orders.dishesAndItems', {
                dishes: lines.length,
                count: order.itemCount,
              })}
            </AppText>
          </View>
        </View>
        <Badge>
          {isOwner ? t('orders.readyToBill') : t('orders.orderSaved')}
        </Badge>
      </View>
      <View style={styles.dishes}>
        {lines.map(line => (
          <AppText muted style={styles.line} key={line.id}>
            {line.name} × {line.quantity}
          </AppText>
        ))}
      </View>
      <View style={styles.bottom}>
        <AppText style={styles.totalLabel}>
          {isOwner ? t('orders.customerTotal') : t('orders.orderTotal')}
          {'  '}
          <AppText style={styles.total}>{formatCurrency(order.total)}</AppText>
        </AppText>
        <View style={styles.arrow}>
          <Icon name={isOwner ? 'arrow' : 'edit'} size={15} />
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    paddingVertical: 19,
    paddingHorizontal: 18,
    borderRadius: 27,
    backgroundColor: colors.white,
  },
  compact: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  name: { flex: 1 },
  title: { fontSize: 17, lineHeight: 23.8 },
  count: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  dishes: { marginVertical: 16 },
  line: { fontSize: 12, lineHeight: 22 },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, flex: 1 },
  total: { fontSize: 16, lineHeight: 24, color: colors.forest },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
