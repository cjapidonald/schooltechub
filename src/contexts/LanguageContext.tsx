import React, { createContext, useContext, useMemo } from 'react';
import { en } from '../translations/en';

type Language = 'en';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = {
  en,
};

const defaultLanguageContext: LanguageContextType = {
  language: 'en',
  setLanguage: (lang: Language) => {
    console.warn(
      `setLanguage called outside of LanguageProvider. Requested language: ${lang}`
    );
  },
  t: translations.en,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo<LanguageContextType>(() => ({
    language: 'en',
    setLanguage: (requested) => {
      if (requested !== 'en') {
        console.warn(`Only English is supported. Ignoring requested language: ${requested}`);
      }
    },
    t: translations.en,
  }), []);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (context === defaultLanguageContext) {
    console.warn('useLanguage was called outside of a LanguageProvider. Falling back to defaults.');
  }

  return context;
};
