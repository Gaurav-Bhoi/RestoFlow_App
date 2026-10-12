import { useTranslation } from 'react-i18next';
import { useRestaurant } from '../restaurant/RestaurantProvider';
import { createDemoRestaurant } from '../restaurant/demoData';
import { useSession } from './SessionProvider';
import { isValidPhone, normalizePhone } from './validation';

export function useAuth() {
  const { t } = useTranslation();
  const { restaurant, dispatch } = useRestaurant();
  const { signIn } = useSession();
  function login(phoneInput: string) {
    const phone = normalizePhone(phoneInput);
    if (!isValidPhone(phone)) {
      throw new Error(t('auth.enterAValid10DigitIndianMobileNumber'));
    }
    const waiter = restaurant.waiters.find(member => member.phone === phone);
    if (waiter) {
      signIn({ role: 'waiter', ...waiter });
      return true;
    }
    if (phone === restaurant.phone) {
      signIn({
        role: 'owner',
        phone,
        name: restaurant.owner,
        photo: restaurant.photo,
      });
      return true;
    }
    return false;
  }
  function register(
    name: string,
    owner: string,
    phoneInput: string,
    photo?: string,
  ) {
    const phone = normalizePhone(phoneInput);
    if (!name.trim() || !owner.trim() || !isValidPhone(phone)) {
      throw new Error(t('auth.addYourRestaurantNameAndAValidMobileNumber'));
    }
    if (
      phone === restaurant.phone ||
      restaurant.waiters.some(waiter => waiter.phone === phone)
    ) {
      throw new Error(t('auth.thisMobileNumberAlreadyBelongsToAnAccount'));
    }
    const startedAt = new Date();
    const endsAt = new Date(startedAt);
    endsAt.setDate(endsAt.getDate() + 15);
    dispatch({
      type: 'replace',
      restaurant: {
        ...createDemoRestaurant(),
        name: name.trim(),
        owner: owner.trim(),
        phone,
        photo,
        tables: [],
        waiters: [],
        nextTableId: 1,
        trialStartedAt: startedAt.toISOString(),
        trialEndsAt: endsAt.toISOString(),
      },
    });
    signIn({ role: 'owner', phone, name: owner.trim(), photo });
  }
  return { login, register };
}
