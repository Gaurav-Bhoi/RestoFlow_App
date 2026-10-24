import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { DishImage } from './DishImage';
import { colors } from '../../theme/tokens';

export function DishPhotoField({
  uri,
  editing,
  disabled,
  onPress,
}: {
  uri: string;
  editing: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={styles.picker}
    >
      <View style={styles.image}>
        <DishImage uri={uri} />
      </View>
      <AppText style={styles.label}>
        {t(editing ? 'menu.changeImage' : 'menu.addImageOptional')}
      </AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  picker: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 9,
    marginBottom: 32,
  },
  image: {
    width: 106,
    height: 92,
    backgroundColor: colors.food,
    borderRadius: 23,
    overflow: 'hidden',
    padding: 7,
  },
  label: {
    color: colors.forest,
    fontSize: 12,
    lineHeight: 18,
    minHeight: 30,
    paddingTop: 6,
  },
});
