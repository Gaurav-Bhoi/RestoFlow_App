import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';

export function BillStatus({
  title,
  description,
  loading,
  children,
}: React.PropsWithChildren<{
  title: string;
  description: string;
  loading?: boolean;
}>) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.status,
        { paddingTop: Math.max(32, Math.min(225, height * 0.29 - insets.top)) },
      ]}
    >
      <View style={styles.icon}>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel={title}
            size="large"
            color={colors.forest}
          />
        ) : (
          <Icon name="check" size={54} />
        )}
      </View>
      <AppText
        variant="heading"
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={styles.center}
      >
        {title}
      </AppText>
      <AppText muted style={styles.description}>
        {description}
      </AppText>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  status: { alignItems: 'center' },
  icon: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  center: { textAlign: 'center' },
  description: {
    fontSize: 13,
    lineHeight: 22.1,
    marginTop: 16,
    textAlign: 'center',
  },
  actions: { alignSelf: 'stretch', marginTop: 60, gap: 16 },
});
