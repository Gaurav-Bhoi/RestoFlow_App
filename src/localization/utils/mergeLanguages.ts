import type { LanguageMetadata } from '../types';

export function mergeLanguages(
  bundled: LanguageMetadata[],
  remote: LanguageMetadata[],
): LanguageMetadata[] {
  const metadata = (language: LanguageMetadata): LanguageMetadata => ({
    code: language.code,
    name: language.name,
    nativeName: language.nativeName,
    direction: language.direction,
    source: language.source,
    ...(language.forceBundled ? { forceBundled: true } : {}),
  });
  const result = new Map<string, LanguageMetadata>(
    bundled.map(language => [
      language.code,
      { ...metadata(language), source: 'bundled' as const },
    ]),
  );
  for (const language of remote) {
    if (language.code !== 'en' && !result.get(language.code)?.forceBundled)
      result.set(language.code, { ...metadata(language), source: 'argos' });
  }
  return [...result.values()].sort((a, b) =>
    a.code === 'en' ? -1 : b.code === 'en' ? 1 : a.name.localeCompare(b.name),
  );
}
