import frLocale from '@fullcalendar/core/locales/fr';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { normalizeLanguage } from '../i18n/languages';

/** FullCalendar locale object for the active app language. */
export function getFullCalendarLocale(language: string) {
  switch (normalizeLanguage(language)) {
    case 'pt':
      return ptBrLocale;
    case 'fr':
      return frLocale;
    default:
      return 'en';
  }
}
