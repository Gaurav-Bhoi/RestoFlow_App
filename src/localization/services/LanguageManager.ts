import type { i18n } from 'i18next';
import type {
  LanguageMetadata,
  TranslationApi,
  TranslationBundle,
  TranslationCacheEntry,
} from '../types';
import { mergeLanguages } from '../utils/mergeLanguages';
import { validateBundle } from '../utils/validateBundle';
import { TranslationCache } from './translationCache';

export interface LanguageState {
  language: string;
  source: 'bundled' | 'argos';
  available: LanguageMetadata[];
  loading: string | null;
  error: 'download' | 'languages' | 'persistence' | null;
  restartRequired: boolean;
}
type Bundled = Record<
  string,
  LanguageMetadata & { translations: TranslationBundle }
>;

export class LanguageManager {
  private state: LanguageState;
  private listeners = new Set<() => void>();
  private sourceVersion: string;
  private preferredLanguage = 'en';
  private queue: Promise<unknown> = Promise.resolve();
  private started?: Promise<void>;
  constructor(
    private engine: i18n,
    private cache: TranslationCache,
    private api: TranslationApi,
    private bundled: Bundled,
    version: string,
    private applyDirection: (direction: 'ltr' | 'rtl') => boolean = () => false,
  ) {
    this.sourceVersion = version;
    this.state = {
      language: 'en',
      source: 'bundled',
      available: mergeLanguages(Object.values(bundled), []),
      loading: null,
      error: null,
      restartRequired: false,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(values: Partial<LanguageState>) {
    this.state = { ...this.state, ...values };
    this.listeners.forEach(listener => listener());
  }

  start(): Promise<void> {
    return (this.started ??= this.restore());
  }
  private async restore() {
    const selection = await this.cache.selected();
    if (!selection || selection.language === 'en') return;
    this.preferredLanguage = selection.language;
    if (
      (selection.source === 'bundled' ||
        this.bundled[selection.language]?.forceBundled) &&
      this.bundled[selection.language]
    ) {
      await this.activate(
        selection.language,
        'bundled',
        this.bundled[selection.language].translations,
        this.bundled[selection.language].direction,
        false,
      );
    } else if (selection.source === 'argos') {
      const cached = await this.cache.get(selection.language);
      if (cached) {
        const metadata = cached.metadata ?? {
          code: selection.language,
          name: selection.language,
          nativeName: selection.language,
          direction: this.direction(selection.language),
          source: 'argos' as const,
        };
        this.update({
          available: mergeLanguages(Object.values(this.bundled), [metadata]),
        });
        await this.activate(
          selection.language,
          'argos',
          cached.translations,
          metadata.direction,
          false,
        );
      }
    }
    // Startup is entirely local. Language discovery/version refresh occurs afterward.
  }
  private direction(code: string): 'ltr' | 'rtl' {
    return (
      this.state.available.find(language => language.code === code)
        ?.direction ??
      (['ar', 'he', 'fa', 'ur', 'ps', 'dv'].includes(code.split('-')[0])
        ? 'rtl'
        : 'ltr')
    );
  }
  private async activate(
    code: string,
    source: 'bundled' | 'argos',
    translations: TranslationBundle,
    direction: 'ltr' | 'rtl',
    persist = true,
  ) {
    if (persist) await this.cache.select(code, source);
    // Replace old resources so missing new keys cannot retain stale translations.
    this.engine.removeResourceBundle(code, 'translation');
    this.engine.addResourceBundle(
      code,
      'translation',
      translations,
      true,
      true,
    );
    await this.engine.changeLanguage(code);
    this.preferredLanguage = code;
    const restartRequired = this.applyDirection(direction);
    this.update({ language: code, source, restartRequired });
  }
  async refreshLanguages(): Promise<void> {
    try {
      const remote = await this.api.getLanguages();
      this.sourceVersion = remote.sourceVersion;
      this.update({
        available: mergeLanguages(
          Object.values(this.bundled),
          remote.languages,
        ),
        error: null,
      });
    } catch {
      this.update({ error: 'languages' });
    }
  }
  async refreshCurrent(): Promise<void> {
    await this.start();
    await this.refreshLanguages();
    if (this.state.error || this.preferredLanguage === 'en') return;
    const language = this.state.available.find(
      item => item.code === this.preferredLanguage,
    );
    if (!language) {
      await this.changeLanguage('en');
      return;
    }
    // Revalidate even when the English hash is unchanged: manual/model overrides may change.
    await this.changeLanguage(language.code, true);
  }
  changeLanguage(code: string, revalidate = false): Promise<boolean> {
    const operation = this.queue.then(() => this.change(code, revalidate));
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  private async change(code: string, revalidate: boolean): Promise<boolean> {
    await this.start();
    const language = this.state.available.find(item => item.code === code);
    if (!language) return false;
    this.update({ loading: code, error: null });
    let cached: TranslationCacheEntry | null = null;
    let stale = false;
    try {
      if (language.source === 'bundled') {
        await this.activate(
          code,
          'bundled',
          this.bundled[code].translations,
          language.direction,
        );
      } else {
        cached = await this.cache.get(code);
        let bundle = cached;
        if (
          revalidate ||
          !cached ||
          cached.sourceVersion !== this.sourceVersion
        ) {
          const result = await this.api.getBundle(code, cached?.etag);
          if (result) {
            validateBundle(result.bundle, code, this.bundled.en.translations);
            stale = result.bundle.stale === true;
            bundle =
              stale && cached
                ? cached
                : {
                    ...result.bundle,
                    etag: result.etag,
                    metadata: language,
                    downloadedAt: new Date().toISOString(),
                  };
            // Keep the last working disk bundle when the server returns a degraded fallback.
            if (result.cacheable && !stale) await this.cache.set(bundle);
          } else if (!cached) throw new Error('No cached bundle');
        }
        if (!bundle) throw new Error('No bundle');
        await this.activate(
          code,
          'argos',
          bundle.translations,
          language.direction,
        );
      }
      if (stale) this.update({ error: 'download' });
      return !stale;
    } catch {
      if (cached) {
        try {
          await this.activate(
            code,
            'argos',
            cached.translations,
            language.direction,
          );
        } catch {
          this.update({ error: 'persistence' });
          return false;
        }
      } else {
        try {
          await this.activate(
            'en',
            'bundled',
            this.bundled.en.translations,
            'ltr',
          );
        } catch {
          this.update({ error: 'persistence' });
          return false;
        }
      }
      this.update({ error: 'download' });
      return false;
    } finally {
      this.update({ loading: null });
    }
  }
}
