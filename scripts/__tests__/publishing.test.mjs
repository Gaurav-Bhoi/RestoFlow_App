import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { publishingPlan } from '../stallion-publish.mjs';
import { root, getEnvironment, parseValues } from '../environment-utils.mjs';
import { parseArguments } from '../native-baseline.mjs';

const args = {
  env: 'development',
  platform: 'android',
  notes: 'Fix billing quantity validation',
  'app-version': '1.0',
};
const native = {
  uploadPath: 'test-org/restoflow-dev/main',
  appToken: '',
  ciToken: '',
};
const baseline = {
  environment: 'development',
  platform: 'android',
  appVersion: '1.0',
  fingerprint: 'native-hash',
};
test('DEV publish cannot target a PROD upload path', () => {
  assert.throws(
    () =>
      publishingPlan(
        args,
        { ...native, uploadPath: 'test-org/restoflow/main' },
        baseline,
        'native-hash',
      ),
    /selected Stallion project/,
  );
  assert.equal(
    publishingPlan(args, native, baseline, 'native-hash').stallionProjectId,
    '6aca897a03fc44c9897cf2b5',
  );
});
test('native dependency/configuration drift blocks OTA', () => {
  assert.throws(
    () => publishingPlan(args, native, baseline, 'changed-native-hash'),
    /Native compatibility/,
  );
  assert.throws(
    () =>
      publishingPlan(
        { ...args, 'app-version': '2.0' },
        native,
        baseline,
        'native-hash',
      ),
    /Native compatibility/,
  );
});
test('production requires explicit confirmation, DEV verification, and signing', () => {
  const prod = { ...args, env: 'production' };
  const prodNative = { ...native, uploadPath: 'test-org/restoflow/main' };
  const prodBaseline = { ...baseline, environment: 'production' };
  assert.throws(
    () => publishingPlan(prod, prodNative, prodBaseline, 'native-hash'),
    /Production requires/,
  );
  assert.throws(
    () =>
      publishingPlan(
        { ...prod, 'confirm-production': 'restoflow', 'dev-verified': true },
        prodNative,
        prodBaseline,
        'native-hash',
      ),
    /signing keys/,
  );
});
test('App Token cannot authenticate CLI publishing', () => {
  assert.throws(
    () =>
      publishingPlan(
        args,
        { ...native, appToken: 'runtime', ciToken: 'runtime' },
        baseline,
        'native-hash',
      ),
    /App Token cannot/,
  );
});
test('missing/invalid env, platform, notes, and duplicate selectors fail', () => {
  assert.throws(() => getEnvironment('staging'));
  assert.throws(() =>
    publishingPlan(
      { ...args, env: undefined },
      native,
      baseline,
      'native-hash',
    ),
  );
  assert.throws(() =>
    publishingPlan(
      { ...args, platform: 'web' },
      native,
      baseline,
      'native-hash',
    ),
  );
  assert.throws(() =>
    publishingPlan(
      { ...args, notes: 'update' },
      native,
      baseline,
      'native-hash',
    ),
  );
  assert.throws(() =>
    parseArguments(['--env=development', '--env=production']),
  );
  assert.throws(() => parseValues('APP_ENV=development\nAPP_ENV=production'));
});
test('mocks allow Debug validation but block release and conflicting ENVFILE', () => {
  const run = (extra = [], env = {}) =>
    spawnSync(
      process.execPath,
      ['scripts/validate-environment.mjs', 'development', ...extra],
      { cwd: root, env: { ...process.env, ...env }, encoding: 'utf8' },
    );
  assert.equal(run().status, 0);
  assert.equal(run(['--release']).status, 1);
  assert.equal(run([], { ENVFILE: '.env.production' }).status, 1);
});
test('all iOS configurations and schemes map to their own native environment', () => {
  const project = readFileSync(
    resolve(root, 'ios/RestoFlow.xcodeproj/project.pbxproj'),
    'utf8',
  );
  for (const environment of ['development', 'production']) {
    const mapping = getEnvironment(environment);
    const suffix = environment === 'development' ? 'Development' : 'Production';
    const scheme = readFileSync(
      resolve(
        root,
        `ios/RestoFlow.xcodeproj/xcshareddata/xcschemes/${mapping.iosScheme}.xcscheme`,
      ),
      'utf8',
    );
    assert.ok(scheme.includes(`buildConfiguration = "Release-${suffix}"`));
    for (const mode of ['Debug', 'Release']) {
      const name = `${mode}-${suffix}`;
      assert.ok(project.includes(name));
      const config = readFileSync(
        resolve(root, `ios/Config/${name}.xcconfig`),
        'utf8',
      );
      assert.ok(config.includes(mapping.stallionProjectId));
      assert.ok(config.includes(`APP_ENVIRONMENT = ${environment}`));
      assert.ok(config.includes(mapping.envFile));
    }
  }
});
