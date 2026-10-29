import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Icon } from './Icon';
import { colors } from '../theme/tokens';
import { ModalSurface } from './ModalSurface';

export function ConfirmationDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalSurface visible={visible} onClose={onCancel} centered>
      <ConfirmationDialogContent
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </ModalSurface>
  );
}
export function ConfirmationDialogContent({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      bounces={false}
      style={styles.dialog}
      contentContainerStyle={styles.content}
      accessibilityViewIsModal
    >
      <View style={styles.icon}>
        <Icon name="alert" color="#b65435" size={40} />
      </View>
      <AppText
        accessibilityRole="header"
        variant="section"
        style={styles.title}
      >
        {title}
      </AppText>
      <AppText muted style={styles.description}>
        {description}
      </AppText>
      {!!error && (
        <AppText accessibilityRole="alert" style={styles.error}>
          {error}
        </AppText>
      )}
      <View style={styles.actions}>
        <AppButton
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          style={styles.action}
        >
          {cancelLabel ?? t('auth.cancel')}
        </AppButton>
        <AppButton
          variant="danger"
          onPress={onConfirm}
          loading={loading}
          style={styles.action}
        >
          {confirmLabel}
        </AppButton>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
  dialog: {
    flexGrow: 0,
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 22,
    paddingTop: 26,
    paddingBottom: 36,
    alignItems: 'center',
  },
  icon: { marginBottom: 24 },
  title: { textAlign: 'center' },
  description: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },
  actions: { flexDirection: 'row', gap: 14, marginTop: 48, width: '100%' },
  action: { flex: 1 },
});
