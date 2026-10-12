import { useTranslation } from 'react-i18next';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';

export function Avatar({
  name,
  photo,
  size = 44,
  dark,
}: {
  name: string;
  photo?: string;
  size?: number;
  dark?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        dark && styles.dark,
      ]}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size }}
          accessibilityLabel={t('common.valueProfilePhoto', { value0: name })}
        />
      ) : (
        <AppText
          numberOfLines={1}
          style={[styles.initials, dark && styles.light]}
        >
          {name.slice(0, 2).toUpperCase()}
        </AppText>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.sageStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dark: { backgroundColor: colors.forest },
  initials: { color: colors.forest, fontSize: 14 },
  light: { color: colors.white },
});
