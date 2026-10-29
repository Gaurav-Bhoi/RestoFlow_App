import { createInstance, type i18n } from 'i18next';
import english from '../src/localization/locales/en.json';
import { BUNDLED_LANGUAGES } from '../src/localization/config/bundledLanguages';
import { sourceVersion } from '../src/localization/catalogMetadata';
import { LanguageManager } from '../src/localization/services/LanguageManager';
import { TranslationCache } from '../src/localization/services/translationCache';
import { migrateLegacyPreference } from '../src/localization/services/migrateLegacyPreference';
import { mergeLanguages } from '../src/localization/utils/mergeLanguages';
import {
  validateBundle,
  flatten,
} from '../src/localization/utils/validateBundle';
import type {
  LanguageMetadata,
  LocalizationStorage,
  TranslationApi,
  TranslationBundleResponse,
} from '../src/localization/types';

const hindi: LanguageMetadata = {
  code: 'hi',
  name: 'Hindi',
  nativeName: 'हिन्दी',
  direction: 'ltr',
  source: 'argos',
};
const remoteBundle: TranslationBundleResponse = {
  language: 'hi',
  source: 'argos',
  sourceLanguage: 'en',
  sourceVersion,
  translations: {
    navigation: { menu: 'मेन्यू' },
    common: { language: 'भाषा' },
  },
};
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
}
function engine(): i18n {
  const instance = createInstance();
  void instance.init({
    lng: 'en',
    fallbackLng: 'en',
    initAsync: false,
    interpolation: { escapeValue: false },
    resources: Object.fromEntries(
      Object.values(BUNDLED_LANGUAGES).map(language => [
        language.code,
        { translation: language.translations },
      ]),
    ),
  });
  return instance;
}
function setup(
  saved: LocalizationStorage = storage(),
  bundled = BUNDLED_LANGUAGES,
  direction: (value: 'ltr' | 'rtl') => boolean = () => false,
) {
  const instance = engine();
  const api = {
    getLanguages: jest.fn(async () => ({
      sourceLanguage: 'en' as const,
      sourceVersion,
      languages: [hindi],
    })),
    getBundle: jest.fn<
      ReturnType<TranslationApi['getBundle']>,
      Parameters<TranslationApi['getBundle']>
    >(async () => ({
      bundle: remoteBundle,
      etag: '"test-hindi"',
      cacheable: true,
    })),
  };
  const cache = new TranslationCache(saved, 'development.test');
  const manager = new LanguageManager(
    instance,
    cache,
    api,
    bundled,
    sourceVersion,
    direction,
  );
  return { manager, instance, cache, api, saved };
}

test('defaults to locally bundled English without network access', async () => {
  const { manager, instance, api } = setup();
  await manager.start();
  expect(instance.language).toBe('en');
  expect(instance.t('navigation.menu')).toBe('Menu');
  expect(api.getLanguages).not.toHaveBeenCalled();
  expect(api.getBundle).not.toHaveBeenCalled();
});
test('switches to Marathi, persists it and makes no remote translation request', async () => {
  const { manager, instance, api, cache } = setup();
  await manager.changeLanguage('mr');
  expect(instance.t('navigation.menu')).toBe('मेनू');
  expect(await cache.selected()).toEqual({ language: 'mr', source: 'bundled' });
  expect(api.getBundle).not.toHaveBeenCalled();
});
test('switches to Hindi, injects resources and caches the downloaded bundle', async () => {
  const { manager, instance, cache, api } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
  expect(api.getBundle).toHaveBeenCalledWith('hi', undefined);
  expect(await cache.get('hi')).toMatchObject({
    language: 'hi',
    sourceVersion,
    etag: '"test-hindi"',
    translations: remoteBundle.translations,
  });
});
test('a cached language works offline across process restarts without downloads', async () => {
  const saved = storage();
  const original = setup(saved);
  await original.manager.refreshLanguages();
  await original.manager.changeLanguage('hi');
  const restarted = setup(saved);
  restarted.api.getLanguages.mockRejectedValue(new Error('offline'));
  restarted.api.getBundle.mockRejectedValue(new Error('offline'));
  await restarted.manager.start();
  expect(restarted.instance.language).toBe('hi');
  expect(restarted.instance.t('navigation.menu')).toBe('मेन्यू');
  expect(restarted.api.getBundle).not.toHaveBeenCalled();
  expect(restarted.manager.getSnapshot().available).toContainEqual(
    expect.objectContaining({ code: 'hi', nativeName: 'हिन्दी' }),
  );
});
test('cached Hindi switches immediately without another HTTP request', async () => {
  const { manager, api } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  await manager.changeLanguage('en');
  await manager.changeLanguage('hi');
  expect(api.getBundle).toHaveBeenCalledTimes(1);
});
test('switches back to bundled English', async () => {
  const { manager, instance } = setup();
  await manager.changeLanguage('mr');
  await manager.changeLanguage('en');
  expect(instance.t('navigation.menu')).toBe('Menu');
});
test('missing remote keys fall back to English', async () => {
  const { manager, instance } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  expect(instance.t('auth.continue')).toBe(english.auth.continue);
});
test('remote failure with a cached bundle preserves that working language', async () => {
  const { manager, instance, api } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  api.getBundle.mockRejectedValue(new Error('server 500'));
  await manager.changeLanguage('hi', true);
  expect(instance.language).toBe('hi');
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
  expect(manager.getSnapshot().error).toBe('download');
});
test('remote failure without a cache uses English and a safe error state', async () => {
  const { manager, instance, api } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('mr');
  api.getBundle.mockRejectedValue(new Error('LibreTranslate stack trace'));
  expect(await manager.changeLanguage('hi')).toBe(false);
  expect(instance.language).toBe('en');
  expect(manager.getSnapshot().error).toBe('download');
  expect(JSON.stringify(manager.getSnapshot())).not.toContain('stack trace');
});
test('restores the persisted manually bundled language', async () => {
  const saved = storage();
  await setup(saved).manager.changeLanguage('mr');
  const { manager, instance, api } = setup(saved);
  await manager.start();
  expect(instance.language).toBe('mr');
  expect(api.getBundle).not.toHaveBeenCalled();
});
test('Argos takes precedence when a language also has a local bundle', async () => {
  const bundled = {
    ...BUNDLED_LANGUAGES,
    hi: {
      ...hindi,
      source: 'bundled' as const,
      translations: { navigation: { menu: 'Bundled Hindi' } },
    },
  };
  const { manager, instance, api } = setup(storage(), bundled);
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
  expect(api.getBundle).toHaveBeenCalledTimes(1);
});
test('forceBundled explicitly overrides remote precedence', async () => {
  const bundled = {
    ...BUNDLED_LANGUAGES,
    hi: {
      ...hindi,
      source: 'bundled' as const,
      forceBundled: true,
      translations: { navigation: { menu: 'Preferred Hindi' } },
    },
  };
  const { manager, instance, api } = setup(storage(), bundled);
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  expect(instance.t('navigation.menu')).toBe('Preferred Hindi');
  expect(api.getBundle).not.toHaveBeenCalled();
});
test('English remains bundled even if reported as a remote target', () => {
  expect(
    mergeLanguages(Object.values(BUNDLED_LANGUAGES), [
      { ...hindi, code: 'en' },
    ])[0].source,
  ).toBe('bundled');
});
test('English source changes trigger a new download rather than permanently reusing stale resources', async () => {
  const { manager, api } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  const newVersion = 'b'.repeat(64);
  api.getLanguages.mockResolvedValue({
    sourceLanguage: 'en',
    sourceVersion: newVersion,
    languages: [hindi],
  });
  api.getBundle.mockResolvedValue({
    bundle: { ...remoteBundle, sourceVersion: newVersion },
    cacheable: true,
  });
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  expect(api.getBundle).toHaveBeenCalledTimes(2);
});
test('304 revalidation reuses the saved bundle and ETag', async () => {
  const { manager, api, instance } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  api.getBundle.mockResolvedValue(null);
  await manager.changeLanguage('hi', true);
  expect(api.getBundle).toHaveBeenLastCalledWith('hi', '"test-hindi"');
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
});
test('corrupted placeholder output is rejected before resource registration', async () => {
  const { manager, api, cache, instance } = setup();
  await manager.refreshLanguages();
  api.getBundle.mockResolvedValue({
    bundle: {
      ...remoteBundle,
      translations: { common: { preparingLanguage: 'Name lost' } },
    },
    cacheable: true,
  });
  await manager.changeLanguage('hi');
  expect(instance.language).toBe('en');
  expect(await cache.get('hi')).toBeNull();
});
test('RTL changes persist before marking restart required', async () => {
  const direction = jest.fn(() => true);
  const { manager, api, cache } = setup(
    storage(),
    BUNDLED_LANGUAGES,
    direction,
  );
  api.getLanguages.mockResolvedValue({
    sourceLanguage: 'en',
    sourceVersion,
    languages: [
      {
        ...hindi,
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
      },
    ],
  });
  api.getBundle.mockResolvedValue({
    bundle: { ...remoteBundle, language: 'ar' },
    cacheable: true,
  });
  await manager.refreshLanguages();
  await manager.changeLanguage('ar');
  expect(await cache.selected()).toEqual({ language: 'ar', source: 'argos' });
  expect(direction).toHaveBeenCalledWith('rtl');
  expect(manager.getSnapshot().restartRequired).toBe(true);
});
test('DEV and PROD local caches never share selection or bundles', async () => {
  const saved = storage();
  const dev = new TranslationCache(saved, 'development.test');
  const prod = new TranslationCache(saved, 'production.test');
  await dev.select('hi', 'argos');
  await dev.set({ ...remoteBundle, downloadedAt: new Date().toISOString() });
  expect(await prod.selected()).toBeNull();
  expect(await prod.get('hi')).toBeNull();
});
test('unknown/corrupt languages do not register resources', async () => {
  const { manager, instance } = setup();
  expect(await manager.changeLanguage('__proto__')).toBe(false);
  expect(instance.language).toBe('en');
  expect(() =>
    validateBundle(
      {
        ...remoteBundle,
        translations: JSON.parse('{"__proto__":{"bad":"polluted"}}'),
      },
      'hi',
      english,
    ),
  ).toThrow();
});
test('a newer server catalog is compatible with an older app', () => {
  expect(() =>
    validateBundle(
      {
        ...remoteBundle,
        translations: {
          ...remoteBundle.translations,
          newFeature: { title: 'New feature' },
        },
      },
      'hi',
      english,
    ),
  ).not.toThrow();
});
test('every Marathi key matches English and preserves interpolation', () => {
  const source = flatten(english);
  const translated = flatten(BUNDLED_LANGUAGES.mr.translations);
  expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
  for (const [key, text] of Object.entries(source))
    expect((translated[key].match(/\{\{[^}]+\}\}/g) ?? []).sort()).toEqual(
      (text.match(/\{\{[^}]+\}\}/g) ?? []).sort(),
    );
});
test('a missing remote startup cache uses English immediately, then restores the saved choice online', async () => {
  const { manager, cache, api, instance } = setup();
  await cache.select('hi', 'argos');
  await manager.start();
  expect(instance.language).toBe('en');
  expect(api.getBundle).not.toHaveBeenCalled();
  await manager.refreshCurrent();
  expect(instance.language).toBe('hi');
});
test('new selection takes precedence over previous restaurant language preferences', async () => {
  const saved = storage();
  await saved.setItem(
    'restoflow.restaurant.v1',
    JSON.stringify({ language: 'Marathi' }),
  );
  const cache = new TranslationCache(saved, 'development.test');
  await migrateLegacyPreference(saved, cache);
  expect(await cache.selected()).toEqual({ language: 'mr', source: 'bundled' });
  await cache.select('en', 'bundled');
  await migrateLegacyPreference(saved, cache);
  expect(await cache.selected()).toEqual({ language: 'en', source: 'bundled' });
});

test('a stale server fallback preserves a working local cache and retries the update', async () => {
  const { manager, api, cache, instance } = setup();
  await manager.refreshLanguages();
  await manager.changeLanguage('hi');
  const saved = await cache.get('hi');
  const newVersion = 'b'.repeat(64);
  api.getLanguages.mockResolvedValue({
    sourceLanguage: 'en',
    sourceVersion: newVersion,
    languages: [hindi],
  });
  api.getBundle.mockResolvedValue({
    bundle: {
      ...remoteBundle,
      stale: true,
      currentSourceVersion: newVersion,
      translations: { navigation: { menu: 'Older server fallback' } },
    },
    cacheable: false,
  });
  await manager.refreshLanguages();
  expect(await manager.changeLanguage('hi')).toBe(false);
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
  expect(await cache.get('hi')).toEqual(saved);
  expect(manager.getSnapshot().error).toBe('download');
  api.getBundle.mockResolvedValue({
    bundle: { ...remoteBundle, sourceVersion: newVersion },
    cacheable: true,
  });
  expect(await manager.changeLanguage('hi')).toBe(true);
  expect((await cache.get('hi'))?.sourceVersion).toBe(newVersion);
  expect(manager.getSnapshot().error).toBeNull();
});

test('a first-time stale fallback can render without becoming a valid disk cache', async () => {
  const { manager, api, cache, instance } = setup();
  await manager.refreshLanguages();
  api.getBundle.mockResolvedValue({
    bundle: {
      ...remoteBundle,
      stale: true,
      currentSourceVersion: 'b'.repeat(64),
    },
    cacheable: true,
  });
  expect(await manager.changeLanguage('hi')).toBe(false);
  expect(instance.t('navigation.menu')).toBe('मेन्यू');
  expect(await cache.get('hi')).toBeNull();
  expect(await cache.selected()).toEqual({ language: 'hi', source: 'argos' });
  expect(manager.getSnapshot().error).toBe('download');
});

test('stale responses require valid version metadata and cannot overwrite local storage', async () => {
  const { cache } = setup();
  expect(() =>
    validateBundle({ ...remoteBundle, stale: true }, 'hi', english),
  ).toThrow();
  expect(() =>
    validateBundle({ ...remoteBundle, stale: 'true' }, 'hi', english),
  ).toThrow();
  await expect(
    cache.set({
      ...remoteBundle,
      stale: true,
      currentSourceVersion: 'b'.repeat(64),
      downloadedAt: new Date().toISOString(),
    }),
  ).rejects.toThrow('stale');
});
