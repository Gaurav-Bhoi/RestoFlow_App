import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppHeader } from '../../components/AppHeader';
import { SearchInput } from '../../components/SearchInput';
import { FilterChips } from '../../components/FilterChips';
import { AppText } from '../../components/AppText';
import { Icon } from '../../components/Icon';
import { colors } from '../../theme/tokens';
import type { MenuCategory } from '../restaurant/types';
import { menuCategories, filterMenu } from './menuData';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { DishCard } from './DishCard';

export function MenuScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MenuCategory>('All');
  const { restaurant } = useRestaurant();
  const categories = menuCategories(restaurant.menu);
  const dishes = filterMenu(restaurant.menu, search, category);
  return (
    <Screen
      hasTabs
      header={
        <AppHeader
          title={t('navigation.menu')}
          subtitle={t('menu.madeForEveryAppetite')}
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
        placeholder={t('menu.searchTheMenu')}
      />
      <FilterChips
        options={categories.map(value => ({
          value,
          label: value === 'All' ? t('menu.all') : value,
        }))}
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
          {t('menu.noDishesFoundTryAnotherNameOrCategory')}
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
