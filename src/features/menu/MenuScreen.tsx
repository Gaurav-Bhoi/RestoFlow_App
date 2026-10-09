import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { SearchInput } from '../../components/SearchInput';
import { FilterChips } from '../../components/FilterChips';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import { useTranslations } from '../settings/translations';
import type { MenuCategory } from '../restaurant/types';
import { categories, filterMenu } from './menuData';
import { DishCard } from './DishCard';

export function MenuScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MenuCategory>('All');
  const labels = useTranslations();
  const dishes = filterMenu(search, category);
  return (
    <Screen
      hasTabs
      header={
        <AppHeader
          title={labels.Menu}
          subtitle="Made for every appetite."
          right={
            <View style={styles.leaf}>
              <Icon name="leaf" color={colors.terracotta} />
            </View>
          }
        />
      }
    >
      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search the menu"
      />
      <FilterChips
        options={categories.map(value => ({ value, label: value }))}
        selected={category}
        onSelect={setCategory}
      />
      <View style={styles.grid}>
        {dishes.map(dish => (
          <DishCard dish={dish} key={dish.id} />
        ))}
      </View>
      {!dishes.length && (
        <AppText muted style={styles.empty}>
          No dishes found.{'\n'}Try another name or category.
        </AppText>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  leaf: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 19,
    marginTop: 11,
  },
  empty: { textAlign: 'center', paddingVertical: 48 },
});
