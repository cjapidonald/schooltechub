import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
const supportedLanguages = Object.keys(translations) as Language[];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getLanguageFromPath = (pathname: string): Language => {
    const [, maybeLang] = pathname.split('/');
    return supportedLanguages.includes(maybeLang as Language)
      ? (maybeLang as Language)
      : 'en';
  };

  const [language, setLanguageState] = useState<Language>(() => getLanguageFromPath(location.pathname));

  useEffect(() => {
    setLanguageState((current) => {
      const urlLang = getLanguageFromPath(location.pathname);
      return current === urlLang ? current : urlLang;
    });
  }, [location.pathname]);

  const setLanguage = (newLang: Language) => {
    if (newLang === language) {
      return;
    }

    setLanguageState(newLang);

    // Get current path without language prefix
    let currentPath = location.pathname;
    
    // Remove existing language prefix if present
    const langPrefixRegex = new RegExp(`^/(${supportedLanguages.join('|')})(/|$)`);
    if (langPrefixRegex.test(currentPath)) {
      currentPath = currentPath.replace(langPrefixRegex, '/');
    }

    const searchAndHash = `${location.search}${location.hash}`;

    // Navigate to new language path
    if (newLang === 'en') {
      navigate(`${currentPath}${searchAndHash}`);
    } else {
      const localizedPath = currentPath === '/' ? `/${newLang}` : `/${newLang}${currentPath}`;
      navigate(`${localizedPath}${searchAndHash}`);
    }
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
