import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { nativeFingerprint } from './native-baseline.mjs';

try {
  const [environment, platform, destination] = process.argv.slice(2);
  const fingerprint = nativeFingerprint(environment, platform);
  if (destination) {
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      JSON.stringify({
        environment,
        platform,
        fingerprint,
        configuration: process.env.CONFIGURATION,
      }) + '\n',
    );
  } else {
    console.log(fingerprint);
  }
} catch {
  console.error('Could not compute native compatibility fingerprint');
  process.exitCode = 1;
}
