import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { colors, navigationLayout } from '../theme/tokens';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { FigmaAsset } from '../components/FigmaAsset';
import { useTranslation } from 'react-i18next';

const tabIcons: Record<string, IconName> = {
  Dashboard: 'grid',
  Menu: 'menu',
  Settings: 'settings',
};
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { frameWidth } = useResponsiveLayout();
  return (
    <View
      style={[
        styles.position,
        {
          bottom: insets.bottom + navigationLayout.bottomGap,
          left: insets.left,
          right: insets.right,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.bar, { width: frameWidth - navigationLayout.inset * 2 }]}
      >
        {state.routes.map((route, index) => {
          const isSelected = state.index === index;
          const label = t(`navigation.${route.name.toLowerCase()}`);
          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isSelected && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              key={route.key}
              onPress={handlePress}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
              style={[styles.tab, isSelected ? styles.active : styles.inactive]}
            >
              {state.index === 0 ? (
                <FigmaAsset
                  name={
                    index === 0
                      ? 'grid-light'
                      : index === 1
                      ? 'menu-muted'
                      : 'settings-muted'
                  }
                />
              ) : (
                <Icon
                  name={tabIcons[route.name]}
                  size={20}
                  color={isSelected ? colors.white : colors.muted}
                />
              )}
              <AppText
                numberOfLines={1}
                ellipsizeMode="tail"
                maxFontSizeMultiplier={1.3}
                style={[styles.label, isSelected && styles.activeLabel]}
              >
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', alignItems: 'center' },
  bar: {
    height: navigationLayout.height,
    borderRadius: 33,
    padding: 5,
    flexDirection: 'row',
    gap: 3,
    backgroundColor: colors.white,
    boxShadow: '0px 6px 12px rgba(23, 63, 53, 0.06)',
  },
  tab: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 7,
  },
  active: {
    flex: 10 / 7,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.forest,
  },
  inactive: { flexDirection: 'column' },
  label: {
    fontSize: 9,
    color: colors.muted,
    lineHeight: 13.5,
  },
  activeLabel: { fontSize: 11, lineHeight: 16.5, color: colors.white },
});
