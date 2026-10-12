import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  root,
  parseValues,
  validateBuildEnvironment,
} from './environment-utils.mjs';

// Backward-compatible command; API origins now live only in native env files.
const updates = {
  development: process.env.RESTOFLOW_DEV_API_URL,
  production: process.env.RESTOFLOW_PROD_API_URL,
};
const originals = new Map();
try {
  for (const [environment, origin] of Object.entries(updates)) {
    if (origin === undefined) continue;
    const path = resolve(root, `.env.${environment}`);
    const original = readFileSync(path, 'utf8');
    originals.set(path, original);
    const values = parseValues(original);
    values.API_BASE_URL = origin;
    writeFileSync(
      path,
      Object.entries(values)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n') + '\n',
    );
  }
  validateBuildEnvironment('development');
  validateBuildEnvironment('production');
  console.log(
    'Validated mobile API origins in native environment files. Rebuild after changes.',
  );
} catch (error) {
  for (const [path, original] of originals) writeFileSync(path, original);
  throw error;
}
