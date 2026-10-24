import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { AppButton } from '../../components/AppButton';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';

export function MenuEmptyState({
  onAdd,
  ledger,
}: {
  onAdd?: () => void;
  ledger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.empty}>
      <View style={styles.illustration}>
        <Icon name={ledger ? 'ledger' : 'cutlery'} size={48} />
      </View>
      <AppText variant="section" style={styles.title}>
        {t(ledger ? 'menu.noEntriesYet' : 'menu.noDishesYet')}
      </AppText>
      <AppText muted variant="small" style={styles.description}>
        {t(ledger ? 'menu.ledgerPreview' : 'menu.addFirstDish')}
      </AppText>
      {onAdd && (
        <AppButton onPress={onAdd} style={styles.action}>
          {t('menu.addDish')}
        </AppButton>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    minHeight: 360,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 30, textAlign: 'center' },
  description: { marginTop: 10, textAlign: 'center' },
  action: { width: '100%', maxWidth: 310, marginTop: 56 },
});
