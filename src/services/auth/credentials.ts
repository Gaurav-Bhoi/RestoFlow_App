import * as Keychain from 'react-native-keychain';
import { ENV } from '../../config/env';
import type { AuthTokens } from '../../api/types';
export interface Credentials {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
}
const service = `restoflow.${ENV.APP_ENV}.${encodeURIComponent(
  ENV.API_BASE_URL,
)}.session`;
let current: Credentials | null = null;
let restored = false;
let restoring: Promise<Credentials | null> | null = null;
let writes = Promise.resolve();
let revision = 0;
export async function getCredentials(): Promise<Credentials | null> {
  if (restored) return current;
  if (!restoring) {
    const expectedRevision = revision;
    restoring = Keychain.getGenericPassword({ service })
      .then(result => {
        let saved: Credentials | null = null;
        if (result) {
          try {
            const value: unknown = JSON.parse(result.password);
            if (
              value &&
              typeof value === 'object' &&
              'accessToken' in value &&
              typeof value.accessToken === 'string' &&
              'refreshToken' in value &&
              typeof value.refreshToken === 'string' &&
              'accessExpiresAt' in value &&
              typeof value.accessExpiresAt === 'number'
            )
              saved = value as Credentials;
          } catch {
            /* Invalid secure data requires a fresh sign-in. */
          }
        }
        if (revision === expectedRevision) {
          current = saved;
          restored = true;
        }
        return current;
      })
      .finally(() => {
        restoring = null;
      });
  }
  return restoring;
}
export async function saveTokens(
  tokens: AuthTokens,
  expectedRefreshToken?: string,
) {
  const expectedRevision = revision;
  const next: Credentials = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessExpiresAt: Date.now() + tokens.accessTokenExpiresIn * 1000,
  };
  const operation = writes.then(async () => {
    if (
      revision !== expectedRevision ||
      (expectedRefreshToken && current?.refreshToken !== expectedRefreshToken)
    )
      throw new Error('The session changed. Please sign in again.');
    const result = await Keychain.setGenericPassword(
      'restoflow-session',
      JSON.stringify(next),
      {
        service,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    if (!result) throw new Error('Secure session storage is unavailable.');
    if (revision === expectedRevision) {
      current = next;
      restored = true;
    }
  });
  writes = operation.catch(() => undefined);
  await operation;
}
export async function clearCredentials() {
  revision += 1;
  current = null;
  restored = true;
  const operation = writes.then(async () => {
    await Keychain.resetGenericPassword({ service });
  });
  writes = operation.catch(() => undefined);
  await operation;
}
export const getAccessToken = async () =>
  (await getCredentials())?.accessToken ?? null;
