import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { LanguageManager } from './services/LanguageManager';
import { TranslationCache } from './services/translationCache';
import { createTranslationApi } from './services/translationApi';
import { BUNDLED_LANGUAGES } from './config/bundledLanguages';
import { ENV } from '../config/env';
import { sourceVersion } from './catalogMetadata';
import { migrateLegacyPreference } from './services/migrateLegacyPreference';
import { initializeApplication } from '../app/bootstrap';

const environment = ENV.APP_ENV;
const baseUrl = ENV.API_BASE_URL;
const translationCache = new TranslationCache(
  AsyncStorage,
  `${environment}.${encodeURIComponent(baseUrl || 'unconfigured')}`,
);
export const languageManager = new LanguageManager(
  i18n,
  translationCache,
  createTranslationApi(baseUrl, environment),
  BUNDLED_LANGUAGES,
  sourceVersion,
  direction => {
    const rtl = direction === 'rtl';
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    return rtl !== I18nManager.isRTL;
  },
);

export function LocalizationProvider({ children }: React.PropsWithChildren) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    initializeApplication(
      async () => {
        await migrateLegacyPreference(AsyncStorage, translationCache);
        await languageManager.start();
      },
      async () => {
        await i18n.changeLanguage('en');
      },
    ).finally(() => {
      if (mounted) setReady(true);
      // Network discovery never blocks local startup or the native splash.
      languageManager.refreshCurrent().catch(() => undefined);
    });
    let lastRefresh = Date.now();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && Date.now() - lastRefresh > 15 * 60 * 1000) {
        lastRefresh = Date.now();
        languageManager.refreshCurrent().catch(() => undefined);
      }
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return (
    <I18nextProvider i18n={i18n}>{ready ? children : null}</I18nextProvider>
  );
}
export function useLanguage() {
  return useSyncExternalStore(
    languageManager.subscribe,
    languageManager.getSnapshot,
  );
}
