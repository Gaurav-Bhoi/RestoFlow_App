export type LanguageCode = string;
export type LanguageSource = 'bundled' | 'argos';
export type TranslationBundle = { [key: string]: string | TranslationBundle };
export interface LanguageMetadata {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  source: LanguageSource;
  forceBundled?: boolean;
}
export interface TranslationBundleResponse {
  language: string;
  source: LanguageSource;
  sourceLanguage: 'en';
  sourceVersion: string;
  translations: TranslationBundle;
  stale?: boolean;
  currentSourceVersion?: string;
}
export interface TranslationCacheEntry extends TranslationBundleResponse {
  metadata?: LanguageMetadata;
  etag?: string;
  downloadedAt: string;
}
export interface LanguagesResponse {
  sourceLanguage: 'en';
  sourceVersion: string;
  languages: LanguageMetadata[];
}
export interface TranslationApi {
  getLanguages(): Promise<LanguagesResponse>;
  getBundle(
    language: string,
    etag?: string,
  ): Promise<{
    bundle: TranslationBundleResponse;
    etag?: string;
    cacheable: boolean;
  } | null>;
}
export interface LocalizationStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
}
