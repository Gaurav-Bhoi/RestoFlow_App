import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  root,
  getEnvironment,
  validateBuildEnvironment,
  nativeValues,
} from './environment-utils.mjs';

export function parseArguments(args) {
  const values = {};
  for (const arg of args) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!match || Object.hasOwn(values, match[1]))
      throw new Error('Use unique --name=value arguments');
    values[match[1]] = match[2] ?? true;
  }
  return values;
}

export function nativeFingerprint(environment, platform) {
  getEnvironment(environment);
  if (!['android', 'ios'].includes(platform))
    throw new Error('An explicit android or ios platform is required');
  const hash = createHash('sha256');
  const skipped = new Set([
    'build',
    'Pods',
    '.gradle',
    '.cxx',
    '.kotlin',
    'xcuserdata',
    'DerivedData',
  ]);
  function add(path) {
    if (!existsSync(path)) return;
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) {
        if (
          !skipped.has(name) &&
          ![
            'local.properties',
            '.xcode.env.local',
            'Stallion.local.xcconfig',
          ].includes(name)
        )
          add(resolve(path, name));
      }
    } else {
      hash.update(relative(root, path));
      hash.update(readFileSync(path));
    }
  }
  add(resolve(root, platform));
  add(resolve(root, 'config/environments.json'));
  add(resolve(root, getEnvironment(environment).envFile));
  add(resolve(root, 'react-native.config.js'));
  // A conservative lockfile baseline catches changes to native transitive dependencies.
  add(resolve(root, 'package-lock.json'));
  add(resolve(root, 'scripts/validate-ios.sh'));
  add(resolve(root, 'scripts/validate-environment.mjs'));
  add(resolve(root, 'scripts/environment-utils.mjs'));
  add(resolve(root, 'scripts/native-fingerprint.mjs'));
  const native = nativeValues(environment);
  // Opaque hash detects native runtime credential/key changes without recording values.
  hash.update(native.appToken);
  if (native.publicKeyPath) add(resolve(root, native.publicKeyPath));
  return hash.digest('hex');
}

export const baselinePath = (environment, platform) =>
  resolve(root, '.native-baselines', `${environment}.${platform}.json`);

function verifyBinary(path, environment, platform, appVersion, fingerprint) {
  const mapping = getEnvironment(environment);
  if (platform === 'android') {
    if (!path.endsWith('.apk') || !statSync(path).isFile())
      throw new Error('Provide the tested release APK');
    const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
    if (!sdk)
      throw new Error('ANDROID_HOME is required to inspect the release APK');
    const tools = readdirSync(resolve(sdk, 'build-tools')).sort().reverse();
    const aapt = tools
      .map(version => resolve(sdk, 'build-tools', version, 'aapt2'))
      .find(existsSync);
    if (!aapt) throw new Error('aapt2 is required to inspect the release APK');
    const metadata = execFileSync(aapt, ['dump', 'badging', path], {
      encoding: 'utf8',
    });
    if (
      !metadata.includes(`name='${mapping.androidApplicationId}'`) ||
      !metadata.includes(`versionName='${appVersion}'`) ||
      metadata.includes('application-debuggable')
    ) {
      throw new Error(
        'APK identity/version/release mode does not match the baseline',
      );
    }
    const resources = execFileSync(aapt, ['dump', 'resources', path], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    const embeddedHash =
      /string\/NativeCompatibilityHash[^\n]*\n[^\n]*"([a-f0-9]{64})"/.exec(
        resources,
      )?.[1];
    if (embeddedHash !== fingerprint)
      throw new Error(
        'APK was built from different native sources; rebuild before recording',
      );
  } else {
    const plist = resolve(path, 'Info.plist');
    const value = key =>
      execFileSync('plutil', ['-extract', key, 'raw', plist], {
        encoding: 'utf8',
      }).trim();
    if (
      value('CFBundleIdentifier') !== mapping.iosBundleId ||
      value('CFBundleShortVersionString') !== appVersion ||
      value('AppEnvironment') !== environment ||
      value('StallionProjectId') !== mapping.stallionProjectId
    ) {
      throw new Error(
        'iOS binary identity/version/environment does not match the baseline',
      );
    }
    const embedded = JSON.parse(
      readFileSync(resolve(path, 'native-compatibility.json'), 'utf8'),
    );
    if (
      embedded.environment !== environment ||
      embedded.platform !== platform ||
      embedded.configuration !==
        `Release-${
          environment === 'development' ? 'Development' : 'Production'
        }` ||
      embedded.fingerprint !== fingerprint
    )
      throw new Error(
        'iOS app was built from different native sources; rebuild before recording',
      );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = parseArguments(process.argv.slice(2));
    const { env, platform, binary, 'app-version': appVersion } = args;
    validateBuildEnvironment(env, { release: true });
    if (!['android', 'ios'].includes(platform))
      throw new Error('Platform must be android or ios');
    if (
      typeof appVersion !== 'string' ||
      !/^\d+\.\d+(?:\.\d+)?$/.test(appVersion)
    )
      throw new Error('A precise native app version is required');
    if (typeof binary !== 'string')
      throw new Error(
        'Provide --binary with the release APK or iOS .app that was tested',
      );
    const path = resolve(root, binary);
    const fingerprint = nativeFingerprint(env, platform);
    verifyBinary(path, env, platform, appVersion, fingerprint);
    const binaryHash =
      platform === 'android'
        ? createHash('sha256').update(readFileSync(path)).digest('hex')
        : undefined;
    mkdirSync(resolve(root, '.native-baselines'), { recursive: true });
    writeFileSync(
      baselinePath(env, platform),
      JSON.stringify(
        {
          environment: env,
          platform,
          appVersion,
          fingerprint,
          binaryHash,
          recordedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      `Recorded ${env} ${platform} native compatibility baseline for ${appVersion}. Device OTA verification is still required.`,
    );
  } catch (error) {
    console.error(`Native baseline failed: ${error.message}`);
    process.exitCode = 1;
  }
}
