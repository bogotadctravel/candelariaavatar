'use client';

import { translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/language-context';

export const useTranslation = () => {
  const { lang } = useLanguage();

  const t = (key: keyof typeof translations.es) => {
    return translations[lang][key];
  };

  return { t, lang };
};
