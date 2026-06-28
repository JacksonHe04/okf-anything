'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { zh } from './zh';

export type Locale = 'en' | 'zh';

export type Translations = typeof zh;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'moon-locale';

const translations: Record<Locale, Translations> = { en, zh };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'en' || stored === 'zh') {
      setLocaleState(stored);
    } else {
      // Auto-detect browser language
      if (typeof window !== 'undefined' && window.navigator) {
        const lang = window.navigator.language.toLowerCase();
        if (lang.startsWith('en')) {
          setLocaleState('en');
        } else {
          setLocaleState('zh');
        }
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const t = (key: keyof Translations): string => {
    const dict = translations[locale] || translations['zh'];
    const val = dict[key] || translations['zh'][key] || String(key);
    return val;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
