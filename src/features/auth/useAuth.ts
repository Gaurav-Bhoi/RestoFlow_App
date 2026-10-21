import { authApi } from '../../api/restoflow';
import { useSession } from './SessionProvider';
import { toE164Phone } from './validation';
import type { ProfilePhoto } from '../restaurant/types';
export function useAuth() {
  const { signIn } = useSession();
  return {
    checkPhone: (phone: string) => authApi.checkPhone(toE164Phone(phone)),
    requestLogin: (phone: string) => authApi.requestOtp(toE164Phone(phone)),
    requestRegistration: (phone: string) =>
      authApi.requestOtp(toE164Phone(phone), true),
    login: async (challengeId: string, otp: string) => {
      await signIn(await authApi.verifyLogin(challengeId, otp));
    },
    verifyRegistration: authApi.verifyRegistration,
    register: async (
      token: string,
      restaurantName: string,
      ownerName: string,
      photo?: ProfilePhoto,
    ) => {
      await signIn(
        await authApi.register(
          token,
          ownerName.trim(),
          restaurantName.trim(),
          photo,
        ),
      );
    },
  };
}
