import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useLocalizedNavigate = () => {
  const navigate = useNavigate();

  const localizedNavigate = useCallback((path: string, options?: any) => {
    navigate(path, options);
  }, [navigate]);

  return localizedNavigate;
};

export const getLocalizedPath = (path: string, _language?: string) => {
  return path;
};