import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, locales, type Locale } from '@/lib/i18n';

const messagesMap = {
  en: () => import('../messages/en.json').then((module) => module.default),
  ja: () => import('../messages/ja.json').then((module) => module.default)
} as const satisfies Record<Locale, () => Promise<Record<string, unknown>>>;

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = (locale as Locale | undefined) ?? defaultLocale;
  const loadMessages = messagesMap[resolvedLocale];

  return {
    defaultLocale,
    locales,
    locale: resolvedLocale,
    messages: await loadMessages()
  };
});
