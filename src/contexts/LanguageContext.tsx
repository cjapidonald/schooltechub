import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const { lang } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial language from URL param or default to 'en'
  const initialLang: Language = (lang === 'sq' || lang === 'vi') ? lang : 'en';
  const [language, setLanguageState] = useState<Language>(initialLang);

  useEffect(() => {
    // Update language state when URL param changes
    const urlLang: Language = (lang === 'sq' || lang === 'vi') ? lang : 'en';
    if (urlLang !== language) {
      setLanguageState(urlLang);
    }
  }, [lang]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    
    // Get current path without language prefix
    let currentPath = location.pathname;
    
    // Remove existing language prefix if present
    const langPrefixRegex = /^\/(sq|vi)(\/|$)/;
    if (langPrefixRegex.test(currentPath)) {
      currentPath = currentPath.replace(langPrefixRegex, '/');
    }
    
    // Navigate to new language path
    if (newLang === 'en') {
      navigate(currentPath);
    } else {
      navigate(`/${newLang}${currentPath === '/' ? '' : currentPath}`);
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