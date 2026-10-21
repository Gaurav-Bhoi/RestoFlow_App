import * as Keychain from 'react-native-keychain';
import {
  saveTokens,
  clearCredentials,
  getCredentials,
} from '../src/services/auth/credentials';
import { account, DEV_ORIGIN } from './support/apiFixtures';
test('tokens are scoped to the environment and stored in native secure storage', async () => {
  await saveTokens(account);
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'restoflow-session',
    expect.any(String),
    expect.objectContaining({
      service: `restoflow.development.${encodeURIComponent(
        DEV_ORIGIN,
      )}.session`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  );
  expect((await getCredentials())?.accessToken).toBe(account.accessToken);
  await clearCredentials();
  expect(await getCredentials()).toBeNull();
});
test('a stale rotation cannot recreate credentials after logout', async () => {
  await saveTokens(account);
  await clearCredentials();
  await expect(
    saveTokens(
      { ...account, accessToken: 'rotated', refreshToken: 'rotated-refresh' },
      account.refreshToken,
    ),
  ).rejects.toThrow('session changed');
  expect(await getCredentials()).toBeNull();
});
test('failed secure storage does not publish a session in memory', async () => {
  jest.mocked(Keychain.setGenericPassword).mockResolvedValueOnce(false);
  await expect(saveTokens(account)).rejects.toThrow('Secure session storage');
  expect(await getCredentials()).toBeNull();
});
