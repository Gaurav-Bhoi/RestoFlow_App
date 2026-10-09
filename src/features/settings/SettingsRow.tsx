import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme/tokens';

interface SettingsRowProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
  hasDivider?: boolean;
}
export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  hasDivider,
}: SettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, hasDivider && styles.divider]}
    >
      <View style={[styles.icon, danger && styles.dangerIcon]}>
        <Icon
          name={icon}
          size={20}
          color={danger ? colors.error : colors.forest}
        />
      </View>
      <View style={styles.details}>
        <AppText style={[styles.title, danger && styles.dangerTitle]}>
          {title}
        </AppText>
        <AppText muted style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>
      <Icon name="arrow" size={16} color={colors.muted} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  icon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  subtitle: { fontSize: 10, lineHeight: 16, marginTop: 3 },
  dangerTitle: { color: colors.error },
  dangerIcon: { backgroundColor: colors.dangerSoft },
});
