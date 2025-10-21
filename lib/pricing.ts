import type { PricingConfig } from './data';

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

export function calculateQuote(
  config: PricingConfig,
  input: QuoteItemInput,
  extras: { shipping: number; taxRate: number; dutiesRate: number }
): QuoteBreakdown {
  const unit = calculateUnitPrice(config, input);
  const optionsTotal = calculateOptions(config, input.options, input.qty);
  const subtotal = unit * input.qty + optionsTotal;
  const shipping = extras.shipping;
  const tax = subtotal * extras.taxRate;
  const duties = subtotal * extras.dutiesRate;
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
