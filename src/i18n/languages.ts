export const SUPPORTED_LANGUAGES = ['en', 'pt', 'fr'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Map browser or stored locale tags to a supported app language (default English). */
export function normalizeLanguage(lang: string | undefined | null): AppLanguage {
  if (!lang) return 'en';
  const code = lang.toLowerCase().split('-')[0];
  if (code === 'pt') return 'pt';
  if (code === 'fr') return 'fr';
  return 'en';
}

export function resolveBrowserLanguage(browserLang: string): AppLanguage {
  return normalizeLanguage(browserLang);
}
