import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../components/BottomSheet';
import { SheetOption } from '../../components/SheetOption';
import { AppText } from '../../components/AppText';

export function WorkspaceSheet({
  visible,
  workspace,
  isOwner,
  onSelect,
  onClose,
}: {
  visible: boolean;
  workspace: 'menu' | 'ledger';
  isOwner: boolean;
  onSelect: (workspace: 'menu' | 'ledger') => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      title={t('menu.yourWorkspace')}
      onClose={onClose}
    >
      <SheetOption
        label={t('navigation.menu')}
        icon="cutlery"
        selected={workspace === 'menu'}
        plain
        trailing
        onPress={() => onSelect('menu')}
      />
      <SheetOption
        label={t('menu.ledger')}
        icon="ledger"
        selected={workspace === 'ledger'}
        plain
        trailing
        disabled={!isOwner}
        onPress={() => onSelect('ledger')}
      />
      <AppText muted variant="helper" style={styles.helper}>
        {t('menu.ledgerOwnersOnly')}
      </AppText>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({ helper: { marginTop: 14 } });
