import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors, navigationLayout } from '../../theme/tokens';

export function LedgerNotice({
  message,
  onDismiss,
  hasTabs = false,
}: {
  message: string;
  onDismiss: () => void;
  hasTabs?: boolean;
}) {
  const { t } = useTranslation();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message || !focused) return;
    const timeout = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timeout);
  }, [message, focused, onDismiss]);
  if (!message || !focused) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.position,
        {
          bottom:
            insets.bottom +
            (hasTabs
              ? navigationLayout.height + navigationLayout.bottomGap
              : 76) +
            12,
        },
      ]}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.toast}
      >
        <Icon name="check" size={18} color={colors.white} />
        <AppText style={styles.message}>{t(message)}</AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', alignSelf: 'center', maxWidth: '90%' },
  toast: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest,
  },
  message: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16.8,
    flexShrink: 1,
  },
});
