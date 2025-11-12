import type { Locale } from '@/lib/i18n';

export const BASE_CURRENCY = 'JPY' as const;

export const DISPLAY_CURRENCIES = [
  BASE_CURRENCY,
  'USD',
  'EUR',
  'GBP',
  'AUD'
] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const FX_RATES: Record<DisplayCurrency, number> = {
  JPY: 1,
  USD: 0.0064,
  EUR: 0.0059,
  GBP: 0.0049,
  AUD: 0.0098
};

export function convertFromJPY(amountJPY: number, currency: DisplayCurrency): number {
  const rate = FX_RATES[currency];
  return amountJPY * rate;
}

export function formatCurrency(amountJPY: number, currency: DisplayCurrency, locale: Locale): string {
  const amount = convertFromJPY(amountJPY, currency);
  const usesZeroFraction = currency === BASE_CURRENCY;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: usesZeroFraction ? 0 : 2,
    maximumFractionDigits: usesZeroFraction ? 0 : 2
  }).format(amount);
}
