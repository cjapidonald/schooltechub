import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { en } from '../translations/en';
import { sq } from '../translations/sq';
import { vi } from '../translations/vi';

type Language = 'en' | 'sq' | 'vi';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = {
  en,
  sq,
  vi
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const langParam = searchParams.get('lang');
  const initialLang: Language = (langParam === 'sq' || langParam === 'vi') ? langParam : 'en';
  const [language, setLanguageState] = useState<Language>(initialLang);

  useEffect(() => {
    const langParam = searchParams.get('lang');
    const newLang: Language = (langParam === 'sq' || langParam === 'vi') ? langParam : 'en';
    if (newLang !== language) {
      setLanguageState(newLang);
    }
  }, [searchParams, language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    const newParams = new URLSearchParams(searchParams);
    if (lang === 'en') {
      newParams.delete('lang');
    } else {
      newParams.set('lang', lang);
    }
    setSearchParams(newParams);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};