import type { Dish, DishId, MenuCategory } from '../restaurant/types';

export const menu: Dish[] = [
  {
    id: 'paneer',
    name: 'Paneer Tikka',
    description: 'Smoky & spiced',
    price: 250,
    category: 'Starters',
  },
  {
    id: 'dal',
    name: 'Dal Tadka',
    description: 'Comfort in a bowl',
    price: 180,
    category: 'Mains',
  },
  {
    id: 'roti',
    name: 'Roti',
    description: 'Fresh from the tawa',
    price: 30,
    category: 'Breads',
  },
  {
    id: 'rice',
    name: 'Jeera Rice',
    description: 'Fluffy, fragrant rice',
    price: 150,
    category: 'Mains',
  },
  {
    id: 'naan',
    name: 'Butter Naan',
    description: 'Soft, buttery bread',
    price: 60,
    category: 'Breads',
  },
  {
    id: 'coke',
    name: 'Coke',
    description: 'Served chilled',
    price: 60,
    category: 'Drinks',
  },
];
export const categories: MenuCategory[] = [
  'All',
  'Starters',
  'Mains',
  'Breads',
  'Drinks',
];
export function getDish(id: DishId): Dish {
  const dish = menu.find(item => item.id === id);
  if (!dish) {
    throw new Error(`Unknown dish: ${id}`);
  }
  return dish;
}
export function filterMenu(search: string, category: MenuCategory = 'All') {
  const query = search.trim().toLowerCase();
  return menu.filter(
    dish =>
      (category === 'All' || dish.category === category) &&
      dish.name.toLowerCase().includes(query),
  );
}
