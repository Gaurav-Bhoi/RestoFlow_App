import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Icon, type IconName } from '../components/Icon';
import { colors, fonts } from '../theme/tokens';
import { useRestaurant } from '../features/restaurant/RestaurantProvider';
import { useTranslations } from '../features/settings/translations';

const tabIcons: Record<string, IconName> = {
  Dashboard: 'grid',
  Menu: 'menu',
  Settings: 'settings',
};
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const labels = useTranslations();
  const { restaurant } = useRestaurant();
  return (
    <View style={[styles.bar, { bottom: Math.max(insets.bottom, 18) + 5 }]}>
      {state.routes.map((route, index) => {
        const isSelected = state.index === index;
        const label = labels[route.name as keyof typeof labels];
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
            style={[styles.tab, isSelected ? styles.active : styles.inactive]}
          >
            <Icon
              name={tabIcons[route.name]}
              size={20}
              color={isSelected ? colors.white : colors.muted}
            />
            <AppText
              style={[
                styles.label,
                isSelected && styles.activeLabel,
                restaurant.language !== 'English' && styles.script,
              ]}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 66,
    borderRadius: 33,
    padding: 5,
    flexDirection: 'row',
    gap: 3,
    backgroundColor: colors.white,
    shadowColor: colors.forest,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  tab: {
    flex: 1,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 7,
  },
  active: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.forest,
  },
  inactive: { flexDirection: 'column' },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    lineHeight: 14,
  },
  activeLabel: { fontSize: 11, color: colors.white },
  script: { fontFamily: fonts.script },
});
