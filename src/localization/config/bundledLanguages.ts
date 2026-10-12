import english from '../locales/en.json';
import marathi from '../locales/mr.json';
import type { LanguageMetadata, TranslationBundle } from '../types';

export const BUNDLED_LANGUAGES: Record<
  string,
  LanguageMetadata & { translations: TranslationBundle }
> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    source: 'bundled',
    translations: english,
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    direction: 'ltr',
    source: 'bundled',
    translations: marathi,
  },
};
