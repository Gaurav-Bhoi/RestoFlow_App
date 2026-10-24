import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme/tokens';

export function WorkspaceHeader({
  workspace,
  onSwitch,
  onAdd,
  addDisabled,
}: {
  workspace: 'menu' | 'ledger';
  onSwitch: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
}) {
  const { t } = useTranslation();
  const { frameWidth, pagePadding } = useResponsiveLayout();
  return (
    <View
      style={[
        styles.header,
        { width: frameWidth, paddingHorizontal: pagePadding },
      ]}
    >
      <View style={styles.text}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.switchWorkspace')}
          onPress={onSwitch}
          style={styles.titleButton}
        >
          <AppText variant="heading" style={styles.title}>
            {t(workspace === 'menu' ? 'navigation.menu' : 'menu.ledger')}
          </AppText>
          <View style={styles.down}>
            <Icon name="arrow" size={16} />
          </View>
        </Pressable>
        <AppText muted variant="helper">
          {t(
            workspace === 'menu'
              ? 'menu.madeForEveryAppetite'
              : 'menu.ledgerSubtitle',
          )}
        </AppText>
      </View>
      {onAdd && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.addDishAction')}
          onPress={onAdd}
          disabled={addDisabled}
          accessibilityState={{ disabled: addDisabled }}
          style={styles.add}
        >
          <Icon name="plus" size={21} />
          <AppText style={styles.addLabel}>{t('menu.addDishAction')}</AppText>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    alignSelf: 'center',
    minHeight: 67,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: { flex: 1, minWidth: 0 },
  titleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  title: { marginBottom: -3 },
  down: { transform: [{ rotate: '90deg' }], marginTop: 5 },
  add: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },
  addLabel: { color: colors.forest },
});
