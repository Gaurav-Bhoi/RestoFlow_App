import { authApi } from '../../api/restoflow';
import { useSession } from './SessionProvider';
import { toE164Phone } from './validation';
import type { ProfilePhoto } from '../restaurant/types';
import type { OwnerRegistrationInput } from '../../api/types';
export function useAuth() {
  const { signIn } = useSession();
  return {
    checkPhone: (phone: string) => authApi.checkPhone(toE164Phone(phone)),
    login: async (phone: string, password: string) => {
      await signIn(await authApi.login(toE164Phone(phone), password));
    },
    register: async (input: OwnerRegistrationInput, photo?: ProfilePhoto) => {
      await signIn(
        await authApi.register(
          {
            ...input,
            phoneNumber: toE164Phone(input.phoneNumber),
            fullName: input.fullName.trim(),
            restaurantName: input.restaurantName.trim(),
          },
          photo,
        ),
      );
    },
  };
}
