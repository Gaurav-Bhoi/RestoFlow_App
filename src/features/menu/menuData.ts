import type { Dish } from '../restaurant/types';
export function menuCategories(menu: Dish[]) {
  return [
    'All',
    ...Array.from(new Set(menu.map(dish => dish.category)))
      .filter(category => category !== 'All')
      .sort(),
  ];
}
export function filterMenu(menu: Dish[], search: string, category = 'All') {
  const query = search.trim().toLowerCase();
  return menu.filter(
    dish =>
      (category === 'All' || dish.category === category) &&
      dish.name.toLowerCase().includes(query),
  );
}
