// lib/i18n.ts
import {getRequestConfig} from 'next-intl/server';

export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語'
};

// ★ next-intl のリクエスト設定（default export が必須）
export default getRequestConfig(async ({locale}) => {
  const safe =
    (locales as readonly string[]).includes(locale as string)
      ? (locale as Locale)
      : defaultLocale;

  const messages = (await import(`@/messages/${safe}.json`)).default;
  return {messages};
});
