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
  currency: PricingCurrency;
  subtotal: number;
  shipping: number;
  tax: number;
  duties: number;
  total: number;
};

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
    const unitPrice = calculateUnitPrice(config, item);
    const addOns = calculateOptions(config, item.options ?? [], item.qty);
    return sum + unitPrice * item.qty + addOns;
  }, 0);
  };
}
