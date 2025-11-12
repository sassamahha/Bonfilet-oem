import { getPricingConfig } from '@/lib/data';
import type { PricingConfig } from '@/lib/data';
import type { BandFinishId, BandSizeId } from '@/config/band';

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
};

export type QuoteBreakdown = {
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  duties: number;
  total: number;
};

export function calculateUnitPrice(config: PricingConfig, input: QuoteItemInput): number {
  const tier =
    config.tiers.find((t) => input.qty >= t.min && input.qty <= t.max) ?? config.tiers[config.tiers.length - 1];
  const finishCoeff = config.coeff.finish[input.finish] ?? 1;
  const sizeCoeff = config.coeff.size[input.size] ?? 1;
  return tier.unit * finishCoeff * sizeCoeff;
}

export function calculateOptions(config: PricingConfig, options: string[] = [], qty: number): number {
  return options.reduce((sum, option) => {
    const addOn = config.options[option] ?? 0;
    return sum + addOn * qty;
  }, 0);
}

export async function calculatePrice(input: QuoteCalculationInput): Promise<QuoteBreakdown> {
  const config = await getPricingConfig();
  const subtotal = input.items.reduce((sum, item) => {
    const unitPrice = calculateUnitPrice(config, item);
    const addOns = calculateOptions(config, item.options ?? [], item.qty);
    return sum + unitPrice * item.qty + addOns;
  }, 0);

  const shipping = Math.max(2500, Math.round(subtotal * 0.12));
  const tax = Math.round(subtotal * 0.1);
  const duties = input.shipTo.country.toUpperCase() === 'JP' ? 0 : Math.round(subtotal * 0.04);
  const total = subtotal + shipping + tax + duties;

  return {
    currency: config.currency,
    subtotal,
    shipping,
    tax,
    duties,
    total
  };
}
