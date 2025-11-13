import type { BandFinishId, BandSizeId } from '@/config/band';
import { getPricingConfig } from '@/lib/data';
import type { PricingConfig } from '@/lib/data';
import {
  PRICING_CURRENCIES,
  convertAmountFromJPY,
  createPricing,
  findTier,
  hydratePricing,
  resolveCurrency,
  resolveLocale,
  serializePricing,
  type Pricing,
  type PricingCurrency,
  type SerializedPricing
} from './pricing/shared';

export { PRICING_CURRENCIES, hydratePricing, serializePricing } from './pricing/shared';
export type { Pricing, PricingCurrency, SerializedPricing } from './pricing/shared';

export async function getPricing(localeOrCountry: string): Promise<Pricing> {
  const config = await getPricingConfig();
  const currency = resolveCurrency(localeOrCountry);
  const locale = resolveLocale(localeOrCountry, currency);

  return createPricing({
    currency,
    locale,
    tiers: config.tiers,
    coeff: config.coeff
  });
}

export type QuoteItemInput = {
  qty: number;
  finish: BandFinishId;
  size: BandSizeId;
  options?: string[];
};

export type QuoteCalculationInput = {
  items: QuoteItemInput[];
  shipTo: {
    country: string;
  };
  currency: PricingCurrency;
};

export type QuoteBreakdown = {
  currency: PricingCurrency;
  subtotal: number;
  shipping: number;
  tax: number;
  duties: number;
  total: number;
};

function calculateUnitPrice(config: PricingConfig, input: QuoteItemInput): number {
  const tier = findTier(config.tiers, input.qty);
  const finishCoeff = config.coeff.finish[input.finish] ?? 1;
  const sizeCoeff = config.coeff.size[input.size] ?? 1;
  return tier.unit * finishCoeff * sizeCoeff;
}

function calculateOptions(config: PricingConfig, options: string[] = [], qty: number): number {
  return options.reduce((sum, option) => {
    const addOn = config.options[option] ?? 0;
    return sum + addOn * qty;
  }, 0);
}

export async function calculatePrice(input: QuoteCalculationInput): Promise<QuoteBreakdown> {
  const config = await getPricingConfig();
  const currency = input.currency;

  const subtotalJPY = input.items.reduce((sum, item) => {
    const unitPrice = calculateUnitPrice(config, item);
    const addOns = calculateOptions(config, item.options ?? [], item.qty);
    return sum + unitPrice * item.qty + addOns;
  }, 0);

  const shippingJPY = Math.max(2500, Math.round(subtotalJPY * 0.12));
  const taxJPY = Math.round(subtotalJPY * 0.1);
  const dutiesJPY = input.shipTo.country.toUpperCase() === 'JP' ? 0 : Math.round(subtotalJPY * 0.04);
  const totalJPY = subtotalJPY + shippingJPY + taxJPY + dutiesJPY;

  const toDisplay = (amountJPY: number) => convertAmountFromJPY(amountJPY, currency);

  return {
    currency,
    subtotal: toDisplay(subtotalJPY),
    shipping: toDisplay(shippingJPY),
    tax: toDisplay(taxJPY),
    duties: toDisplay(dutiesJPY),
    total: toDisplay(totalJPY)
  };
}
