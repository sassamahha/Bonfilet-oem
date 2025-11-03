import { getPricingConfig } from './data';
import type { PricingConfig } from './data';
import type { ParsedQuoteRequest } from './validation';

export type QuoteItemInput = {
  qty: number;
  finish: string;
  size: string;
  options?: string[];
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
  const tier = config.tiers.find((t) => input.qty >= t.min && input.qty <= t.max) ?? config.tiers[config.tiers.length - 1];
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

export async function calculatePrice(input: ParsedQuoteRequest): Promise<QuoteBreakdown> {
  const config = await getPricingConfig();
  const item = input.items[0];
  const quoteInput: QuoteItemInput = {
    qty: item.qty,
    finish: item.finish,
    size: item.size,
    options: item.options
  };
  const currency = input.currency ?? config.currency ?? 'JPY';
  const shipping = 25 + Math.max(0, item.qty - 30) * 0.15;
  const taxRate = 0.1;
  const dutiesRate = 0.05;

  const unit = calculateUnitPrice(config, quoteInput);
  const optionsTotal = calculateOptions(config, quoteInput.options, quoteInput.qty);
  const subtotal = unit * quoteInput.qty + optionsTotal;
  const tax = subtotal * taxRate;
  const duties = subtotal * dutiesRate;
  const total = subtotal + shipping + tax + duties;

  return {
    currency,
    subtotal,
    shipping,
    tax,
    duties,
    total
  };
}

