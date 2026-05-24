import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n/languages';

const LANGUAGE_LABEL_KEYS: Record<AppLanguage, string> = {
  en: 'language.en',
  pt: 'language.pt',
  fr: 'language.fr',
};

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = i18n.language.split('-')[0] as AppLanguage;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectLanguage = (code: AppLanguage) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.label')}
      >
        <Languages size={20} aria-hidden />
        <span className="text-sm font-medium">
          {t(LANGUAGE_LABEL_KEYS[active] ?? LANGUAGE_LABEL_KEYS.en)}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('language.label')}
          className="absolute right-0 mt-1 min-w-[10rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {SUPPORTED_LANGUAGES.map((code) => {
            const isActive = active === code;
            return (
              <li key={code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => selectLanguage(code)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                    isActive ? 'text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{t(LANGUAGE_LABEL_KEYS[code])}</span>
                  {isActive && <Check size={16} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
