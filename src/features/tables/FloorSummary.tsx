import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../components/AppText';
import { FigmaAsset } from '../../components/FigmaAsset';
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
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const numberHeight = Math.max(37, 37 * Math.min(fontScale, 1.3));
  return (
    <View style={styles.summary}>
      <View style={styles.metric}>
        <View style={[styles.numberBox, { height: numberHeight }]}>
          <AppText
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
            style={styles.number}
          >
            {occupied}
            <AppText style={styles.denominator}> / {tables}</AppText>
          </AppText>
        </View>
        <AppText
          muted
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.3}
          style={styles.label}
        >
          {t('dashboard.tablesOccupied')}
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <View style={[styles.numberBox, { height: numberHeight }]}>
          <AppText
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.3}
            style={styles.number}
          >
            {guests}
          </AppText>
        </View>
        <AppText
          muted
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          maxFontSizeMultiplier={1.3}
          style={styles.label}
        >
          {t('dashboard.guestsOnTheFloor')}
        </AppText>
      </View>
      <FigmaAsset name="cutlery" />
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
  metric: { flex: 1, minWidth: 0 },
  numberBox: { height: 37 },
  number: {
    fontSize: 31,
    lineHeight: 43.4,
    transform: [{ translateY: -3 }],
  },
  denominator: { fontSize: 19, lineHeight: 26.6, color: colors.muted },
  label: { fontSize: 11, lineHeight: 16.5, marginTop: 2 },
  divider: { width: 1, height: 35, backgroundColor: '#bacabb' },
});
