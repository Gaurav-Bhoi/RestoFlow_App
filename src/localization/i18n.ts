import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { BUNDLED_LANGUAGES } from './config/bundledLanguages';

// Synchronous local initialization, exactly once, before any screen is rendered.
void i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  resources: Object.fromEntries(
    Object.values(BUNDLED_LANGUAGES).map(language => [
      language.code,
      { translation: language.translations },
    ]),
  ),
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
  react: { useSuspense: false },
});
export default i18next;
