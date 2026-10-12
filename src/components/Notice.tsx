import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { FigmaAsset, type FigmaAssetName } from './FigmaAsset';

export function Notice({
  children,
  icon = 'info',
  assetIcon,
}: {
  children: string;
  icon?: IconName;
  assetIcon?: FigmaAssetName;
}) {
  return (
    <View style={styles.notice}>
      {assetIcon ? (
        <FigmaAsset name={assetIcon} />
      ) : (
        <Icon name={icon} size={18} />
      )}
      <AppText style={styles.copy}>{children}</AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  notice: {
    minHeight: 72.78125,
    backgroundColor: colors.sage,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    minHeight: 40.78125,
    color: colors.forest,
    fontSize: 12,
    lineHeight: 20.4,
  },
});
