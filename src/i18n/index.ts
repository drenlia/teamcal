import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { normalizeLanguage } from './languages';
import { enUS, ptBR, frFR } from './locales';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enUS },
      pt: { translation: ptBR },
      fr: { translation: frFR },
    },
    supportedLngs: ['en', 'pt', 'fr'],
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => normalizeLanguage(lng),
    },
  });

export default i18n;
