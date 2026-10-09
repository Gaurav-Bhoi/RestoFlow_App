import { Platform, StyleSheet } from 'react-native';
import design from '../../design/design_tokens.json';

export const colors = {
  ...design.colors,
  sageStrong: '#d5e3d4',
  forestLight: '#365e4d',
  peach: '#faeee6',
  line: '#e1e5dc',
  food: '#f4f1e7',
  dangerSoft: '#f8eeee',
};
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  page: 22,
  xl: 24,
  xxl: 32,
};
export const radius = design.radius;
export const motion = design.motion_ms;
export const fonts = {
  body: Platform.select({ ios: 'System', default: 'sans-serif' }),
  heading: Platform.select({ ios: 'System', default: 'sans-serif' }),
  script: 'NotoSansDevanagari-Regular',
};
export const layout = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stack: { gap: 14 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 18,
  },
  divider: { height: 1, backgroundColor: colors.line },
});
