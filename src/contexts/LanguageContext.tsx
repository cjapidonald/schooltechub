import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  const getLanguageFromPath = () => 'en';

  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState('en');
  }, [location.pathname]);

  const setLanguage = (_newLang: Language) => {
    setLanguageState('en');
    // Only English is supported, so we simply ensure the URL does not contain
    // any legacy language prefixes and keep the navigation within the current path.
    let currentPath = location.pathname;
    const langPrefixRegex = new RegExp('^/(sq|vi)(/|$)');
    if (langPrefixRegex.test(currentPath)) {
      currentPath = currentPath.replace(langPrefixRegex, '/');
    }

    const searchAndHash = `${location.search}${location.hash}`;
    navigate(`${currentPath}${searchAndHash}`);
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

  if (context === defaultLanguageContext) {
    console.warn('useLanguage was called outside of a LanguageProvider. Falling back to defaults.');
  }

  return context;
};
