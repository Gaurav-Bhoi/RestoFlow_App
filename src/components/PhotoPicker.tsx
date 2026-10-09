import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { AppText } from './AppText';

export function PhotoPicker({
  photo,
  onPress,
}: {
  photo?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add optional profile photo"
      onPress={onPress}
      style={styles.picker}
    >
      {photo ? (
        <Avatar name="Profile" photo={photo} size={80} />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="camera" size={24} />
        </View>
      )}
      <AppText style={styles.label}>
        Add photo <AppText muted>· optional</AppText>
      </AppText>
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
  label: {
    color: colors.forest,
    fontWeight: '700',
    fontSize: 12,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
