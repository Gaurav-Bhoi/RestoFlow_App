import React from 'react';
import { StyleSheet, View } from 'react-native';
import Arrow from '../../assets/icons/arrow.svg';
import Back from '../../assets/icons/back.svg';
import Camera from '../../assets/icons/camera.svg';
import Check from '../../assets/icons/check.svg';
import Close from '../../assets/icons/close.svg';
import Crown from '../../assets/icons/crown.svg';
import Cutlery from '../../assets/icons/cutlery.svg';
import Edit from '../../assets/icons/edit.svg';
import Grid from '../../assets/icons/grid.svg';
import Info from '../../assets/icons/info.svg';
import Language from '../../assets/icons/language.svg';
import Leaf from '../../assets/icons/leaf.svg';
import Logout from '../../assets/icons/logout.svg';
import Menu from '../../assets/icons/menu.svg';
import Minus from '../../assets/icons/minus.svg';
import People from '../../assets/icons/people.svg';
import Plus from '../../assets/icons/plus.svg';
import Print from '../../assets/icons/print.svg';
import Search from '../../assets/icons/search.svg';
import Settings from '../../assets/icons/settings.svg';
import Shield from '../../assets/icons/shield.svg';
import Table from '../../assets/icons/table.svg';
import { colors } from '../theme/tokens';

const icons = {
  arrow: Arrow,
  back: Back,
  camera: Camera,
  check: Check,
  close: Close,
  crown: Crown,
  cutlery: Cutlery,
  edit: Edit,
  grid: Grid,
  info: Info,
  language: Language,
  leaf: Leaf,
  logout: Logout,
  menu: Menu,
  minus: Minus,
  people: People,
  plus: Plus,
  print: Print,
  search: Search,
  settings: Settings,
  shield: Shield,
  table: Table,
};
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 22,
  color = colors.forest,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const Asset = icons[name];
  return (
    <View
      accessible={false}
      style={[styles.wrapper, { width: size, height: size }]}
    >
      <View style={[styles.asset, { transform: [{ scale: size / 24 }] }]}>
        <Asset stroke={color} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  asset: { width: 24, height: 24 },
});
