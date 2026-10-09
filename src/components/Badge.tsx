import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';

export function Badge({
  children,
  warm,
  white,
}: {
  children: React.ReactNode;
  warm?: boolean;
  white?: boolean;
}) {
  return (
    <View style={[styles.badge, warm && styles.warm, white && styles.white]}>
      <AppText style={[styles.label, warm && styles.warmLabel]}>
        {children}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.sage,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.forest,
    lineHeight: 16,
  },
  warm: { backgroundColor: colors.peach },
  warmLabel: { color: colors.terracotta },
  white: { backgroundColor: colors.white },
});
