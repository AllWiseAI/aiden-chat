'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
  .use(resourcesToBackend((lang, ns) => import(`./app/locales/${lang}/${ns}.json`)))
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'zh-CN'],
    load: 'currentOnly',
    debug: true,
    ns: ['auth', 'common', 'general', 'settings'],
    defaultNS: 'general',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;