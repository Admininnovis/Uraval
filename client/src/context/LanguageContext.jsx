import React, { createContext, useState, useEffect, useContext } from 'react';
import en from '../translations/en';
import ta from '../translations/ta';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // default to English if not set
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  const t = (key) => {
    const keys = key.split('.');
    let dict = language === 'en' ? en : ta;
    
    for (let k of keys) {
      if (dict && dict[k]) {
        dict = dict[k];
      } else {
        // Fallback to key or English if missing in Tamil
        let fallbackDict = en;
        for (let fk of keys) {
            if (fallbackDict && fallbackDict[fk]) {
                fallbackDict = fallbackDict[fk];
            } else {
                return key;
            }
        }
        return fallbackDict;
      }
    }
    return dict;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
