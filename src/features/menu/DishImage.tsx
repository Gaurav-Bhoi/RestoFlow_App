import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
export function DishImage({ uri }: { uri?: string }) {
  return uri ? (
    <Image source={{ uri }} style={styles.image} resizeMode="cover" />
  ) : (
    <View style={styles.placeholder}>
      <Icon name="cutlery" size={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
