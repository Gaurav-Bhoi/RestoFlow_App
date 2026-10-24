import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ModalSurface } from '../../components/ModalSurface';
import { BottomSheetContent } from '../../components/BottomSheet';
import { ConfirmationDialogContent } from '../../components/ConfirmationDialog';
import { SheetOption } from '../../components/SheetOption';
import type { Dish } from '../restaurant/types';
import { AppText } from '../../components/AppText';
import { colors } from '../../theme/tokens';

export interface DishSelection {
  dish: Dish;
  confirmingDelete: boolean;
}
export function DishManagementOverlay({
  selection,
  onClose,
  onEdit,
  onToggleAvailability,
  onRequestDelete,
  onDelete,
  busy,
  error,
}: {
  selection: DishSelection | null;
  onClose: () => void;
  onEdit: () => void;
  onToggleAvailability: () => void;
  onRequestDelete: () => void;
  onDelete: () => void;
  busy: boolean;
  error: string;
}) {
  const { t } = useTranslation();
  return (
    <ModalSurface
      visible={!!selection}
      onClose={busy ? () => {} : onClose}
      centered={selection?.confirmingDelete}
    >
      {selection?.confirmingDelete ? (
        <ConfirmationDialogContent
          title={t('menu.deleteThisDish')}
          description={t('menu.deleteDescription')}
          confirmLabel={t('menu.delete')}
          onConfirm={onDelete}
          onCancel={onClose}
          loading={busy}
          error={error}
        />
      ) : (
        <BottomSheetContent
          title={selection?.dish.name ?? ''}
          onClose={onClose}
          closeDisabled={busy}
        >
          <SheetOption
            label={t('menu.editDishAction')}
            icon="edit"
            onPress={onEdit}
            disabled={busy}
          />
          <SheetOption
            label={t(
              selection?.dish.available
                ? 'menu.markUnavailable'
                : 'menu.markAvailable',
            )}
            icon="clock"
            onPress={onToggleAvailability}
            disabled={busy}
          />
          <SheetOption
            label={t('menu.deleteDish')}
            icon="trash"
            danger
            onPress={onRequestDelete}
            disabled={busy}
          />
          {busy && (
            <ActivityIndicator
              color={colors.forest}
              accessibilityLabel={t('menu.updatingDish')}
            />
          )}
          {!!error && (
            <AppText accessibilityRole="alert" style={styles.error}>
              {error}
            </AppText>
          )}
        </BottomSheetContent>
      )}
    </ModalSurface>
  );
}
const styles = StyleSheet.create({
  error: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 8,
  },
});
