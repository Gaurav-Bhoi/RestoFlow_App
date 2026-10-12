import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { breakpoints, contentWidths, spacing } from '../theme/tokens';

/** Constrain the content column, leaving typography and controls at design size. */
export function useResponsiveLayout(maxWidth = contentWidths.screen) {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableWidth = Math.max(0, width - insets.left - insets.right);
  const frameWidth = Math.min(availableWidth, maxWidth);
  const pagePadding =
    availableWidth < breakpoints.phoneSmall ? 16 : spacing.page;
  return {
    frameWidth,
    contentWidth: Math.max(0, frameWidth - pagePadding * 2),
    pagePadding,
    isTablet: availableWidth >= breakpoints.tablet,
    isLargeTablet: availableWidth >= breakpoints.tabletLarge,
    isLandscape: width > height,
    fontScale,
  };
}
