import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCallback } from 'react';

export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const localizedNavigate = useCallback((path: string, options?: any) => {
    // Don't add language prefix for English (default language)
    const localizedPath = language === 'en' 
      ? path 
      : `/${language}${path}`;
    
    navigate(localizedPath, options);
  }, [language, navigate]);
  
  return localizedNavigate;
};

export const getLocalizedPath = (path: string, language: string) => {
  return language === 'en' ? path : `/${language}${path}`;
};