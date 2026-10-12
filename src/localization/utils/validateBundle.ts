import type { TranslationBundle, TranslationBundleResponse } from '../types';

export function flatten(
  catalog: TranslationBundle,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(catalog)) {
    if (
      !key ||
      key.includes('.') ||
      ['__proto__', 'prototype', 'constructor'].includes(key)
    )
      throw new Error('Invalid catalog');
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' && value.trim() && value.length <= 20000)
      result[path] = value;
    else if (value && typeof value === 'object' && !Array.isArray(value))
      Object.assign(result, flatten(value, path));
    else throw new Error('Invalid catalog');
  }
  return result;
}
const signature = (value: string) =>
  [
    ...value.matchAll(
      /\{\{[^{}]+\}\}|\$t\([^)]*\)|%(?:\d+\$)?[-+#0 ]*(?:\d+|\*)?(?:\.(?:\d+|\*))?[sdifouxXeEgGc%]|<\/?[A-Za-z][^>]*>/g,
    ),
  ]
    .map(match => match[0])
    .sort()
    .join('|');

export function validateBundle(
  raw: unknown,
  language: string,
  english: TranslationBundle,
): TranslationBundleResponse {
  const bundle = raw as TranslationBundleResponse;
  if (
    !bundle ||
    bundle.language !== language ||
    bundle.source !== 'argos' ||
    bundle.sourceLanguage !== 'en' ||
    !/^[a-f0-9]{64}$/.test(bundle.sourceVersion) ||
    (bundle.stale !== undefined && typeof bundle.stale !== 'boolean') ||
    (bundle.currentSourceVersion !== undefined &&
      !/^[a-f0-9]{64}$/.test(bundle.currentSourceVersion)) ||
    (bundle.stale === true && !bundle.currentSourceVersion) ||
    !bundle.translations ||
    Array.isArray(bundle.translations) ||
    typeof bundle.translations !== 'object'
  )
    throw new Error('Invalid bundle');
  const source = flatten(english);
  const translated = flatten(bundle.translations);
  // Missing keys fall back through i18next. A newer server may include keys added
  // after this app release; validate their structure, but compare only known keys.
  let knownKeys = 0;
  for (const [key, value] of Object.entries(translated)) {
    if (!(key in source)) continue;
    knownKeys++;
    if (signature(source[key]) !== signature(value))
      throw new Error('Invalid bundle');
  }
  if (!knownKeys) throw new Error('Invalid bundle');
  return bundle;
}
