import type { BandFinishId, BandSizeId } from '@/config/band';
import { convertFromJPY, convertToJPY } from '@/lib/currency';
import type { PricingConfig, PricingTier } from '@/lib/data';

export type PricingCurrency = 'JPY' | 'USD';
export const PRICING_CURRENCIES = ['JPY', 'USD'] as const;

type FormatterCacheKey = `${PricingCurrency}-${string}`;

const formatterCache = new Map<FormatterCacheKey, Intl.NumberFormat>();

function getFormatter(currency: PricingCurrency, locale: string): Intl.NumberFormat {
  const key: FormatterCacheKey = `${currency}-${locale}`;
  const cached = formatterCache.get(key);
  if (cached) {
    return cached;
  }

  const usesZeroFraction = currency === 'JPY';
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: usesZeroFraction ? 0 : 2,
    maximumFractionDigits: usesZeroFraction ? 0 : 2
  });

  formatterCache.set(key, formatter);
  return formatter;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

const currencyByLocale: Record<string, PricingCurrency> = {
  ja: 'JPY',
  'ja-jp': 'JPY',
  jp: 'JPY',
  jpn: 'JPY',
  en: 'USD',
  'en-us': 'USD',
  us: 'USD',
  usa: 'USD'
};

export function resolveCurrency(value: string): PricingCurrency {
  const key = normalizeKey(value);
  return currencyByLocale[key] ?? 'JPY';
}

export function resolveLocale(value: string, currency: PricingCurrency): string {
  const key = normalizeKey(value);
  if (key.includes('ja') || key === 'jp' || key === 'jpn') {
    return 'ja-JP';
  }

  if (key.includes('en') || key === 'us' || key === 'usa') {
    return 'en-US';
  }

  return currency === 'JPY' ? 'ja-JP' : 'en-US';
}

export type PricingCoefficients = PricingConfig['coeff'];

export type SerializedPricing = {
  currency: PricingCurrency;
  locale: string;
  tiers: PricingTier[];
  coeff: PricingCoefficients;
};

export type Pricing = {
  currency: PricingCurrency;
  format: (amount: number) => string;
  unitPrice: (input: { size: BandSizeId; finish: BandFinishId; qty: number }) => number;
  shipping: (country: string, subtotal: number) => number;
  tax: (subtotal: number, country: string) => number;
  duties: (subtotal: number, country: string) => number;
  tiers: PricingTier[];
  serialize: () => SerializedPricing;
};

export function findTier(tiers: PricingTier[], qty: number): PricingTier {
  const resolvedQty = Math.max(qty, 1);
  return (
    tiers.find((tier) => resolvedQty >= tier.min && resolvedQty <= tier.max) ??
    tiers[tiers.length - 1]
  );
}

function roundForCurrency(amount: number, currency: PricingCurrency): number {
  if (currency === 'JPY') {
    return Math.round(amount);
  }

  return Number(amount.toFixed(2));
}

export function convertAmountFromJPY(amountJPY: number, currency: PricingCurrency): number {
  if (currency === 'JPY') {
    return Math.round(amountJPY);
  }

  return Number(convertFromJPY(amountJPY, currency).toFixed(2));
}

export function convertAmountToJPY(amount: number, currency: PricingCurrency): number {
  if (currency === 'JPY') {
    return amount;
  }

  return convertToJPY(amount, currency);
}

export function createPricing(data: SerializedPricing): Pricing {
  const { currency, locale, tiers, coeff } = data;
  const formatter = getFormatter(currency, locale);

  const toDisplay = (amountJPY: number) => convertAmountFromJPY(amountJPY, currency);
  const toJPY = (amount: number) => convertAmountToJPY(amount, currency);

  return {
    currency,
    format: (amount: number) => formatter.format(roundForCurrency(amount, currency)),
    unitPrice: ({ size, finish, qty }) => {
      const tier = findTier(tiers, qty);
      const finishCoeff = coeff.finish[finish] ?? 1;
      const sizeCoeff = coeff.size[size] ?? 1;
      const baseUnit = tier.unit * finishCoeff * sizeCoeff;
      return toDisplay(baseUnit);
    },
    shipping: (_country: string, subtotal: number) => {
      const subtotalJPY = toJPY(subtotal);
      const shippingJPY = Math.max(2500, Math.round(subtotalJPY * 0.12));
      return toDisplay(shippingJPY);
    },
    tax: (subtotal: number, _country: string) => {
      const subtotalJPY = toJPY(subtotal);
      const taxJPY = Math.round(subtotalJPY * 0.1);
      return toDisplay(taxJPY);
    },
    duties: (subtotal: number, country: string) => {
      const subtotalJPY = toJPY(subtotal);
      const dutiesJPY = country.toUpperCase() === 'JP' ? 0 : Math.round(subtotalJPY * 0.04);
      return toDisplay(dutiesJPY);
    },
    tiers,
    serialize: () => ({
      currency,
      locale,
      tiers,
      coeff
    })
  };
}

export function hydratePricing(serialized: SerializedPricing): Pricing {
  return createPricing(serialized);
}

export function serializePricing(pricing: Pricing): SerializedPricing {
  return pricing.serialize();
}
