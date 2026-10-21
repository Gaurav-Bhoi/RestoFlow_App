import { existsSync } from 'node:fs';
import {
  getEnvironment,
  validateBuildEnvironment,
  nativeValues,
} from './environment-utils.mjs';

try {
  const environment = process.argv[2];
  const release = process.argv.includes('--release');
  validateBuildEnvironment(environment, {
    release,
  });
  if (process.argv.includes('--ios')) {
    if (existsSync('/tmp/envfile'))
      throw new Error(
        'Remove obsolete /tmp/envfile; it overrides deterministic iOS ENVFILE mapping',
      );
    const configuration = process.env.CONFIGURATION;
    const expected = `${release ? 'Release' : 'Debug'}-${
      environment === 'development' ? 'Development' : 'Production'
    }`;
    if (configuration !== expected)
      throw new Error(
        'iOS configuration does not match the selected environment',
      );
    const mapping = getEnvironment(environment);
    if (process.env.PRODUCT_BUNDLE_IDENTIFIER !== mapping.iosBundleId)
      throw new Error('iOS bundle identifier mismatch');
    if (process.env.STALLION_PROJECT_ID !== mapping.stallionProjectId)
      throw new Error('iOS Stallion project mismatch');
    if (
      release &&
      process.env.STALLION_APP_TOKEN !== nativeValues(environment).appToken
    )
      throw new Error(
        'iOS Stallion token settings are stale; run npm run native:configure',
      );
  }
  console.log(
    `Validated ${environment} ${release ? 'release' : 'debug'} configuration.`,
  );
} catch (error) {
  console.error(`Environment validation failed: ${error.message}`);
  process.exitCode = 1;
}
