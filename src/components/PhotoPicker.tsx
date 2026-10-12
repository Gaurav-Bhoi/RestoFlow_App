import { useTranslation } from 'react-i18next';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { Avatar } from './Avatar';
import { FigmaAsset } from './FigmaAsset';
import { AppText } from './AppText';

export function PhotoPicker({
  photo,
  onPress,
}: {
  photo?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.addOptionalProfilePhoto')}
      onPress={onPress}
      style={styles.picker}
    >
      {photo ? (
        <Avatar name="Profile" photo={photo} size={80} />
      ) : (
        <View style={styles.placeholder}>
          <FigmaAsset name="camera" />
        </View>
      )}
      <View style={styles.labelRow}>
        <AppText variant="label" style={styles.label}>
          {t('common.addPhoto')}{' '}
          <AppText variant="label" muted>
            {t('common.optional')}
          </AppText>
        </AppText>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  picker: { alignItems: 'center', gap: 10, marginTop: 19, marginBottom: 30 },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sageStrong,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { minHeight: 44, justifyContent: 'center' },
  label: { color: colors.forest },
});
