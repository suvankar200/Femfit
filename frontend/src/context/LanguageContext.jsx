import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, LANGUAGES } from '../i18n/index.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('appLanguage', lang);
    }
  }, []);

  // Translation function
  const t = useCallback((key, replacements = {}) => {
    const dict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || key;
    
    // Replace placeholders like {day}
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
