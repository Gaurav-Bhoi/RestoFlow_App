import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { FigmaAsset } from './FigmaAsset';
import { colors, contentWidths } from '../theme/tokens';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export function AppHeader({
  title,
  subtitle,
  onBack,
  backDisabled,
  right,
  maxWidth = contentWidths.screen,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backDisabled?: boolean;
  right?: React.ReactNode;
  maxWidth?: number;
}) {
  const { t } = useTranslation();
  const { frameWidth, pagePadding } = useResponsiveLayout(maxWidth);
  return (
    <View
      style={[
        styles.header,
        { width: frameWidth, paddingHorizontal: pagePadding },
      ]}
    >
      {onBack && (
        <Pressable
          onPress={onBack}
          disabled={backDisabled}
          accessibilityState={{ disabled: backDisabled }}
          accessibilityRole="button"
          accessibilityLabel={t('common.goBack')}
          style={styles.back}
        >
          <FigmaAsset name="back" />
        </Pressable>
      )}
      <View style={styles.text}>
        <AppText
          variant="heading"
          accessibilityRole="header"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.title}
        >
          {title}
        </AppText>
        {!!subtitle && (
          <AppText
            variant="helper"
            muted
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.subtitle}
          >
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    alignSelf: 'center',
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  text: { flex: 1, minWidth: 0 },
  // Figma's 35px title line overhangs its 28.75px layout box by 6.25px.
  title: { marginTop: -1, marginBottom: -5.25 },
  subtitle: { marginTop: 4, transform: [{ translateY: 1 }] },
  back: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
