import React from 'react';
import { StyleSheet, View } from 'react-native';
import Welcome from '../../assets/figma/welcome.svg';
import CutleryLight from '../../assets/figma/cutlery-light.svg';
import ArrowLight from '../../assets/figma/arrow-light.svg';
import Back from '../../assets/figma/back.svg';
import Camera from '../../assets/figma/camera.svg';
import Leaf from '../../assets/figma/leaf.svg';
import Cutlery from '../../assets/figma/cutlery.svg';
import Table from '../../assets/figma/table.svg';
import GridLight from '../../assets/figma/grid-light.svg';
import MenuMuted from '../../assets/figma/menu-muted.svg';
import SettingsMuted from '../../assets/figma/settings-muted.svg';

// Intrinsic dimensions come from the exported SVG roots. Keep the source assets
// intact, including their colors and viewBoxes, and fit their containing slot.
const assets = {
  welcome: { Component: Welcome, width: 300, height: 213 },
  'cutlery-light': { Component: CutleryLight, width: 22, height: 22 },
  'arrow-light': { Component: ArrowLight, width: 19, height: 19 },
  back: { Component: Back, width: 22, height: 22 },
  camera: { Component: Camera, width: 22, height: 22 },
  leaf: { Component: Leaf, width: 18, height: 18 },
  cutlery: { Component: Cutlery, width: 22, height: 22 },
  table: { Component: Table, width: 48, height: 48 },
  'grid-light': { Component: GridLight, width: 20, height: 20 },
  'menu-muted': { Component: MenuMuted, width: 20, height: 20 },
  'settings-muted': { Component: SettingsMuted, width: 20, height: 20 },
};
export type FigmaAssetName = keyof typeof assets;

export function FigmaAsset({
  name,
  width,
}: {
  name: FigmaAssetName;
  width?: number;
}) {
  const {
    Component,
    width: intrinsicWidth,
    height: intrinsicHeight,
  } = assets[name];
  const slotWidth = width ?? intrinsicWidth;
  const scale = slotWidth / intrinsicWidth;
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={[
        styles.slot,
        { width: slotWidth, height: intrinsicHeight * scale },
      ]}
    >
      <View
        style={[
          styles.asset,
          {
            width: intrinsicWidth,
            height: intrinsicHeight,
            transform: [{ scale }],
          },
        ]}
      >
        <Component />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  asset: { flexShrink: 0 },
  slot: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
