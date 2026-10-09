import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { AppButton } from './AppButton';

export function EmptyState({
  title,
  description,
  icon = 'table',
  action,
}: {
  title: string;
  description: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.art}>
        <Icon name={icon} size={48} />
      </View>
      <AppText variant="section" style={styles.center}>
        {title}
      </AppText>
      <AppText muted style={styles.copy}>
        {description}
      </AppText>
      {action && (
        <AppButton onPress={action.onPress} style={styles.action}>
          {action.label}
        </AppButton>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  art: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  center: { textAlign: 'center' },
  copy: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 265,
    marginTop: 10,
    marginBottom: 24,
  },
  action: { alignSelf: 'stretch' },
});
