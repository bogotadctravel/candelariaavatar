'use client';

import { createContext, useContext, useState } from 'react';

export type Lang = 'es' | 'en';

const LanguageContext = createContext({
  lang: 'es' as Lang,
  setLang: (lang: Lang) => {},
});

export const LanguageProvider = ({ children }: any) => {
  const [lang, setLang] = useState<Lang>('es'); // 👈 siempre arranca en español

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
