import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ModalSurface } from './ModalSurface';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { colors, contentWidths } from '../theme/tokens';

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: React.PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>) {
  return (
    <ModalSurface visible={visible} onClose={onClose}>
      <BottomSheetContent title={title} onClose={onClose}>
        {children}
      </BottomSheetContent>
    </ModalSurface>
  );
}
export function BottomSheetContent({
  title,
  onClose,
  closeDisabled,
  children,
}: React.PropsWithChildren<{
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View
      accessibilityViewIsModal
      style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      <View style={styles.handle} />
      <View style={styles.heading}>
        <AppText
          accessibilityRole="header"
          variant="section"
          style={styles.title}
        >
          {title}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.close')}
          disabled={closeDisabled}
          accessibilityState={{ disabled: closeDisabled }}
          onPress={onClose}
          style={styles.close}
        >
          <Icon name="close" size={20} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    maxWidth: contentWidths.form,
    maxHeight: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.paper,
    paddingTop: 12,
  },
  handle: {
    width: 46,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#b3c3b0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 22,
    paddingRight: 10,
    marginBottom: 18,
  },
  title: { flex: 1 },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 22, paddingBottom: 12, gap: 5 },
});
