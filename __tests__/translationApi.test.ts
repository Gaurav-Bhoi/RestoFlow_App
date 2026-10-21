import { createTranslationApi } from '../src/localization/services/translationApi';
import { sourceVersion } from '../src/localization/catalogMetadata';
function response(
  data: unknown,
  options: {
    status?: number;
    environment?: string;
    etag?: string;
    cacheControl?: string;
  } = {},
): Response {
  return {
    status: options.status ?? 200,
    ok: (options.status ?? 200) === 200,
    headers: {
      get: (name: string) =>
        ({
          'X-RestoFlow-Environment': options.environment ?? 'development',
          ETag: options.etag ?? null,
          'Cache-Control':
            options.cacheControl ?? 'public, max-age=0, must-revalidate',
        }[name] ?? null),
    },
    text: async () => JSON.stringify({ success: true, data }),
  } as Response;
}
const bundle = {
  language: 'hi',
  source: 'argos',
  sourceLanguage: 'en',
  sourceVersion,
  translations: { navigation: { menu: 'मेन्यू' } },
};
test('downloads only known language bundles through our Hono origin', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(bundle, { etag: '"bundle"' }),
  );
  const api = createTranslationApi(
    'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
    'development',
    fetcher,
  );
  expect(await api.getBundle('hi')).toMatchObject({
    bundle,
    etag: '"bundle"',
    cacheable: true,
  });
  expect(fetcher.mock.calls[0][0]).toBe(
    'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev/api/v1/i18n/bundle/hi',
  );
});
test('rejects a PROD response in a DEV build before registering resources', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(bundle, { environment: 'production' }),
  );
  await expect(
    createTranslationApi(
      'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
      'development',
      fetcher,
    ).getBundle('hi'),
  ).rejects.toThrow('Environment mismatch');
});
test('revalidates a bundle with its ETag and handles 304', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(null, { status: 304 }),
  );
  const api = createTranslationApi(
    'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
    'development',
    fetcher,
  );
  expect(await api.getBundle('hi', '"old"')).toBeNull();
  expect(fetcher.mock.calls[0][1]?.headers).toEqual({
    'If-None-Match': '"old"',
  });
});
test.each([
  'no-store',
  'private, no-store, max-age=0',
  '  No-Store  , no-cache',
])(
  'does not save degraded translations with Cache-Control %s',
  async cacheControl => {
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
      async () => response(bundle, { cacheControl }),
    );
    const result = await createTranslationApi(
      'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
      'development',
      fetcher,
    ).getBundle('hi');
    expect(result?.cacheable).toBe(false);
  },
);
test('validates discovery metadata from the API', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () =>
      response({
        sourceLanguage: 'en',
        sourceVersion,
        languages: [
          {
            code: 'hi',
            name: 'Hindi',
            nativeName: 'हिन्दी',
            direction: 'ltr',
            source: 'argos',
          },
        ],
      }),
  );
  const api = createTranslationApi(
    'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
    'development',
    fetcher,
  );
  expect((await api.getLanguages()).languages[0].code).toBe('hi');
  fetcher.mockResolvedValue(
    response({
      sourceLanguage: 'en',
      sourceVersion,
      languages: [{ code: '../evil' }],
    }),
  );
  await expect(api.getLanguages()).rejects.toThrow('Invalid languages');
});
test('rejects invalid codes without making an HTTP call', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(bundle),
  );
  await expect(
    createTranslationApi(
      'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
      'development',
      fetcher,
    ).getBundle('../evil'),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
test('never allows external insecure API origins in production', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(bundle),
  );
  await expect(
    createTranslationApi(
      'http://localhost:8787',
      'production',
      fetcher,
    ).getBundle('hi'),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test('development rejects loopback and Preview origins before fetching', async () => {
  const fetcher = jest.fn();
  for (const origin of [
    'http://127.0.0.1:8787',
    'https://preview-restoflow-backend-dev.gauravbhoiofficial.workers.dev',
  ]) {
    await expect(
      createTranslationApi(origin, 'development', fetcher).getBundle('hi'),
    ).rejects.toThrow();
  }
  expect(fetcher).not.toHaveBeenCalled();
});

test('rejects non-HTTP protocols even on a development loopback host', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () => response(bundle),
  );
  await expect(
    createTranslationApi(
      'ftp://localhost:8787',
      'development',
      fetcher,
    ).getBundle('hi'),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});

test('stale bundles remain non-cacheable even if an intermediary sends public caching headers', async () => {
  const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () =>
      response({
        ...bundle,
        stale: true,
        currentSourceVersion: 'b'.repeat(64),
      }),
  );
  const result = await createTranslationApi(
    'https://restoflow-backend-dev.gauravbhoiofficial.workers.dev',
    'development',
    fetcher,
  ).getBundle('hi');
  expect(result?.bundle.stale).toBe(true);
  expect(result?.cacheable).toBe(false);
});
