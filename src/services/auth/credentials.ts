// The current app has local demo sign-in, without backend credentials or refresh.
// Future real auth may register a Keychain/Keystore reader here. Never persist
// access/refresh tokens in the unencrypted preference store.
type AccessTokenReader = () => string | null | Promise<string | null>;
let readAccessToken: AccessTokenReader = () => null;

export function registerAccessTokenReader(reader: AccessTokenReader) {
  readAccessToken = reader;
}

export const getAccessToken = () => readAccessToken();
