import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors, navigationLayout } from '../../theme/tokens';
import { useMenu } from './MenuProvider';

export function MenuNotice() {
  const { notice, dismissNotice } = useMenu();
  const focused = useIsFocused();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!notice || !focused) return;
    const timer = setTimeout(dismissNotice, 3000);
    return () => clearTimeout(timer);
  }, [notice, focused, dismissNotice]);
  if (!notice || !focused) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.position,
        {
          bottom:
            insets.bottom +
            navigationLayout.height +
            navigationLayout.bottomGap +
            12,
        },
      ]}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.toast}
      >
        <Icon name="check" color={colors.white} size={18} />
        <AppText style={styles.message}>{t(notice.message)}</AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    alignItems: 'center',
  },
  toast: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.forest,
  },
  message: { flexShrink: 1, color: colors.white, fontSize: 12, lineHeight: 18 },
});
