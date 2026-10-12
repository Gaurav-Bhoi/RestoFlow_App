import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  root,
  nativeValues,
  isAppToken,
  publicSigningKey,
} from './environment-utils.mjs';

const lines = ['// Generated native-only values. Do not commit this file.'];
for (const environment of ['development', 'production']) {
  const values = nativeValues(environment);
  const prefix =
    environment === 'development' ? 'STALLION_DEV' : 'STALLION_PROD';
  if (values.appToken && !isAppToken(values.appToken)) {
    throw new Error(`Invalid ${environment} Stallion App Token format`);
  }
  let publicKey = '';
  if (values.publicKeyPath) {
    // Both SDK 2.4.2 native verifiers decode SPKI base64 after stripping PEM
    // framing. Store the body directly to avoid xcconfig/plist newline escaping.
    publicKey = publicSigningKey(values.publicKeyPath).toString('base64');
  }
  lines.push(`${prefix}_APP_TOKEN = ${values.appToken}`);
  lines.push(`${prefix}_PUBLIC_KEY = ${publicKey}`);
}
mkdirSync(resolve(root, 'ios/Config'), { recursive: true });
writeFileSync(
  resolve(root, 'ios/Config/Stallion.local.xcconfig'),
  lines.join('\n') + '\n',
  { mode: 0o600 },
);
console.log(
  'Prepared ignored iOS native settings. No token values were logged.',
);
