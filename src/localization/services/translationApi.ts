import type { LanguagesResponse, TranslationApi } from '../types';
import { validateBundle } from '../utils/validateBundle';
import english from '../locales/en.json';
import { apiClient } from '../../api/client';

export function createTranslationApi(
  baseUrl: string,
  environment: 'development' | 'production',
  fetcher?: typeof fetch,
): TranslationApi {
  async function request(path: string, etag?: string) {
    if (!baseUrl) throw new Error('API not configured');
    const url = new URL(baseUrl);
    const local =
      environment === 'development' &&
      ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);
    if (
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw new Error('Invalid API configuration');
    if (!fetcher) {
      const response = await apiClient.get<string>(`/api/v1/i18n${path}`, {
        timeout: 270000,
        responseType: 'text',
        transformResponse: [data => data],
        validateStatus: status =>
          status === 304 || (status >= 200 && status < 300),
        headers: etag ? { 'If-None-Match': etag } : {},
      });
      if (response.status === 304) return null;
      if (response.data.length > 1000000) throw new Error('Invalid response');
      const result = JSON.parse(response.data);
      if (result?.success !== true || !result.data)
        throw new Error('Invalid response');
      return {
        data: result.data,
        etag: response.headers.etag as string | undefined,
        cacheable: !String(response.headers['cache-control'] ?? '')
          .split(',')
          .some(
            (directive: string) =>
              directive.trim().toLowerCase() === 'no-store',
          ),
      };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 270000);
    try {
      const response = await fetcher(`${url.origin}/api/v1/i18n${path}`, {
        signal: controller.signal,
        headers: etag ? { 'If-None-Match': etag } : {},
      });
      if (response.headers.get('X-RestoFlow-Environment') !== environment)
        throw new Error('Environment mismatch');
      if (response.status === 304) return null;
      if (!response.ok) throw new Error('Download unavailable');
      const body = await response.text();
      if (body.length > 1000000) throw new Error('Invalid response');
      const result = JSON.parse(body);
      if (result?.success !== true || !result.data)
        throw new Error('Invalid response');
      return {
        data: result.data,
        etag: response.headers.get('ETag') ?? undefined,
        cacheable: !(response.headers.get('Cache-Control') ?? '')
          .split(',')
          .some(directive => directive.trim().toLowerCase() === 'no-store'),
      };
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    async getLanguages(): Promise<LanguagesResponse> {
      const response = await request('/languages');
      const data = response?.data as LanguagesResponse;
      if (
        !data ||
        data.sourceLanguage !== 'en' ||
        !/^[a-f0-9]{64}$/.test(data.sourceVersion) ||
        !Array.isArray(data.languages) ||
        data.languages.length > 500 ||
        data.languages.some(
          language =>
            !/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/.test(
              language.code,
            ) ||
            typeof language.name !== 'string' ||
            typeof language.nativeName !== 'string' ||
            !['ltr', 'rtl'].includes(language.direction) ||
            language.source !== 'argos',
        )
      )
        throw new Error('Invalid languages');
      return data;
    },
    async getBundle(language, etag) {
      if (
        !/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/.test(
          language,
        )
      )
        throw new Error('Invalid language');
      const response = await request(
        `/bundle/${encodeURIComponent(language)}`,
        etag,
      );
      if (!response) return null;
      const bundle = validateBundle(response.data, language, english);
      return {
        bundle,
        etag: response.etag,
        cacheable: response.cacheable && !bundle.stale,
      };
    },
  };
}
