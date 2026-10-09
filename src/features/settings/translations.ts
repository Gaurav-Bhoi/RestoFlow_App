import { useRestaurant } from '../restaurant/RestaurantProvider';

const translations = {
  English: {
    Dashboard: 'Dashboard',
    Menu: 'Menu',
    Settings: 'Settings',
    tables: 'Restaurant tables',
  },
  Hindi: {
    Dashboard: 'डैशबोर्ड',
    Menu: 'मेन्यू',
    Settings: 'सेटिंग्स',
    tables: 'रेस्टोरेंट टेबल',
  },
  Marathi: {
    Dashboard: 'डॅशबोर्ड',
    Menu: 'मेनू',
    Settings: 'सेटिंग्ज',
    tables: 'रेस्टॉरंट टेबल',
  },
};
export function useTranslations() {
  const { restaurant } = useRestaurant();
  return translations[restaurant.language];
}
