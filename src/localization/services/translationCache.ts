import type { LocalizationStorage, TranslationCacheEntry } from '../types';
import english from '../locales/en.json';
import { validateBundle } from '../utils/validateBundle';

export class TranslationCache {
  constructor(private storage: LocalizationStorage, readonly scope: string) {}
  key(name: string) {
    return `restoflow.i18n.${this.scope}.${name}`;
  }
  async get(language: string): Promise<TranslationCacheEntry | null> {
    try {
      const raw = await this.storage.getItem(this.key(`bundle.${language}`));
      if (!raw || raw.length > 1000000) return null;
      const entry = JSON.parse(raw) as TranslationCacheEntry;
      validateBundle(entry, language, english);
      if (entry.stale) return null;
      if (
        entry.metadata &&
        (entry.metadata.code !== language ||
          entry.metadata.source !== 'argos' ||
          typeof entry.metadata.name !== 'string' ||
          typeof entry.metadata.nativeName !== 'string' ||
          !['ltr', 'rtl'].includes(entry.metadata.direction))
      )
        return null;
      if (
        typeof entry.downloadedAt !== 'string' ||
        !Number.isFinite(Date.parse(entry.downloadedAt)) ||
        (entry.etag !== undefined && typeof entry.etag !== 'string')
      )
        return null;
      return entry;
    } catch {
      return null;
    }
  }
  async set(entry: TranslationCacheEntry) {
    validateBundle(entry, entry.language, english);
    if (entry.stale)
      throw new Error('A stale response cannot replace a working cache');
    await this.storage.setItem(
      this.key(`bundle.${entry.language}`),
      JSON.stringify(entry),
    );
  }
  async selected(): Promise<{
    language: string;
    source: 'bundled' | 'argos';
  } | null> {
    try {
      const raw = await this.storage.getItem(this.key('selection'));
      if (!raw || raw.length > 512) return null;
      const selection = JSON.parse(raw);
      if (
        !/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/.test(
          selection.language,
        ) ||
        !['bundled', 'argos'].includes(selection.source)
      )
        return null;
      return selection;
    } catch {
      return null;
    }
  }
  async select(language: string, source: 'bundled' | 'argos') {
    // One atomic record prevents mismatched language/source after an interrupted write.
    await this.storage.setItem(
      this.key('selection'),
      JSON.stringify({ language, source }),
    );
  }
}
