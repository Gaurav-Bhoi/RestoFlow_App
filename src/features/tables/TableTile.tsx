import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import type { RestaurantTable } from '../restaurant/types';

export function TableTile({
  table,
  onPress,
  onRemove,
}: {
  table: RestaurantTable;
  onPress: () => void;
  onRemove?: () => void;
}) {
  const isOccupied = table.customers.length > 0;
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Table ${table.id}, ${
          isOccupied
            ? `${table.customers.length} customers, occupied`
            : 'available'
        }`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          isOccupied && styles.occupied,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.glyphRow}>
          <View style={[styles.chair, isOccupied && styles.occupiedChair]} />
          <View style={[styles.glyph, isOccupied && styles.occupiedGlyph]} />
          <View style={[styles.chair, isOccupied && styles.occupiedChair]} />
        </View>
        <AppText style={[styles.name, isOccupied && styles.light]}>
          Table {table.id}
        </AppText>
        <AppText style={[styles.description, isOccupied && styles.lightMuted]}>
          {isOccupied
            ? `${table.customers.length} customers`
            : 'Ready for guests'}
        </AppText>
        <AppText style={[styles.status, isOccupied && styles.light]}>
          • {isOccupied ? 'Occupied' : 'Available'}
        </AppText>
      </Pressable>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove Table ${table.id}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <Icon name="close" size={18} />
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { width: '47.4%' },
  tile: {
    minHeight: 145,
    borderRadius: 38,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  occupied: { backgroundColor: colors.forest },
  pressed: { opacity: 0.85 },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  glyph: {
    width: 57,
    height: 36,
    borderRadius: 14,
    backgroundColor: colors.sage,
  },
  chair: { width: 6, height: 21, borderRadius: 4, backgroundColor: '#c8d9c7' },
  occupiedGlyph: { backgroundColor: '#43695c' },
  occupiedChair: { backgroundColor: '#688b7b' },
  name: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  description: { fontSize: 11, color: colors.muted, lineHeight: 17 },
  status: { fontSize: 10, lineHeight: 15, marginTop: 5 },
  light: { color: colors.white },
  lightMuted: { color: '#d4e4d8' },
  remove: {
    position: 'absolute',
    right: 1,
    top: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sage,
  },
});
