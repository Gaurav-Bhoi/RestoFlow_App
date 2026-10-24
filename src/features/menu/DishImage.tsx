import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import Paneer from '../../../assets/illustrations/paneer.svg';
import Dal from '../../../assets/illustrations/dal.svg';
import Rice from '../../../assets/illustrations/rice.svg';
import Roti from '../../../assets/illustrations/roti.svg';
import Naan from '../../../assets/illustrations/naan.svg';
import Coke from '../../../assets/illustrations/coke.svg';

const illustrations = {
  paneer: Paneer,
  dal: Dal,
  rice: Rice,
  roti: Roti,
  naan: Naan,
  coke: Coke,
};
export function DishImage({ uri }: { uri?: string }) {
  const [failedUri, setFailedUri] = useState<string>();
  const illustration = uri?.startsWith('illustration:')
    ? uri.slice(13)
    : undefined;
  const Asset = illustration
    ? illustrations[illustration as keyof typeof illustrations]
    : undefined;
  if (Asset) return <Asset width="100%" height="100%" />;
  return uri && failedUri !== uri ? (
    <Image
      source={{ uri }}
      style={styles.image}
      resizeMode="cover"
      onError={() => setFailedUri(uri)}
    />
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
