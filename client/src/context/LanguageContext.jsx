import React, { createContext, useState, useEffect, useContext } from 'react';
import en from '../translations/en';
import ta from '../translations/ta';
import { translateLiveData } from '../utils/translator';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // default to English if not set
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    if (language === 'ta') {
      document.documentElement.classList.add('lang-ta');
      document.body?.classList.add('lang-ta');
    } else {
      document.documentElement.classList.remove('lang-ta');
      document.body?.classList.remove('lang-ta');
    }
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

  const tData = (text) => translateLiveData(text, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, tData }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
