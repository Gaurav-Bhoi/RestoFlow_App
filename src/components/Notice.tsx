import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export function Notice({
  children,
  icon = 'info',
}: {
  children: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.notice}>
      <Icon name={icon} size={18} />
      <AppText style={styles.copy}>{children}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.sage,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  copy: { flex: 1, color: colors.forest, fontSize: 12, lineHeight: 20 },
});
