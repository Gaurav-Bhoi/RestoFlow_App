import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/AppText';
import { colors } from '../../theme/tokens';
import { menuFilters, type MenuFilter } from './menuConfig';

export function MenuFilters({
  selected,
  onSelect,
}: {
  selected: MenuFilter;
  onSelect: (category: MenuFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {menuFilters.map(filter => (
        <Pressable
          key={filter}
          accessibilityLabel={t(`menu.${filter.toLowerCase()}`)}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === selected }}
          onPress={() => onSelect(filter)}
          style={[styles.filter, filter === selected && styles.selected]}
        >
          <AppText
            style={[styles.label, filter === selected && styles.selectedLabel]}
          >
            {t(`menu.${filter.toLowerCase()}`)}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  filters: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 4,
    paddingVertical: 14,
  },
  filter: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: { backgroundColor: colors.forest },
  label: { fontSize: 12, lineHeight: 18, color: colors.muted },
  selectedLabel: { color: colors.white },
});
