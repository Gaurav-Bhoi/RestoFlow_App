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
import Eye from '../../assets/icons/eye.svg';
import EyeOff from '../../assets/icons/eye-off.svg';
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
import Clock from '../../assets/icons/clock.svg';
import Alert from '../../assets/icons/alert.svg';
import Trash from '../../assets/icons/trash.svg';
import Gallery from '../../assets/icons/gallery.svg';
import Ledger from '../../assets/icons/ledger.svg';
import { colors } from '../theme/tokens';

import Calendar from '../../assets/icons/calendar.svg';
import Download from '../../assets/icons/download.svg';
import Filter from '../../assets/icons/filter.svg';
import Package from '../../assets/icons/package.svg';
import Wallet from '../../assets/icons/wallet.svg';
import File from '../../assets/icons/file.svg';
import Share from '../../assets/icons/share.svg';

const icons = {
  calendar: Calendar,
  download: Download,
  filter: Filter,
  package: Package,
  wallet: Wallet,
  file: File,
  share: Share,

  clock: Clock,
  alert: Alert,
  trash: Trash,
  gallery: Gallery,
  ledger: Ledger,
  arrow: Arrow,
  back: Back,
  camera: Camera,
  check: Check,
  close: Close,
  crown: Crown,
  cutlery: Cutlery,
  edit: Edit,
  eye: Eye,
  'eye-off': EyeOff,
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
