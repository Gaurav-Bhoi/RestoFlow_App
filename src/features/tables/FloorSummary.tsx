import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';

export function FloorSummary({
  occupied,
  tables,
  guests,
}: {
  occupied: number;
  tables: number;
  guests: number;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.metric}>
        <AppText style={styles.number}>
          {occupied}
          <AppText style={styles.denominator}>/{tables}</AppText>
        </AppText>
        <AppText muted style={styles.label}>
          Tables occupied
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <AppText style={styles.number}>{guests}</AppText>
        <AppText muted style={styles.label}>
          Guests on the floor
        </AppText>
      </View>
      <Icon name="cutlery" />
    </View>
  );
}
const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.sage,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  metric: { flex: 1 },
  number: {
    fontSize: 31,
    lineHeight: 34,
    letterSpacing: -1,
    fontWeight: '700',
  },
  denominator: { fontSize: 19, color: colors.muted },
  label: { fontSize: 11, lineHeight: 17, marginTop: 6 },
  divider: { width: 1, height: 35, backgroundColor: '#bacabb' },
});
