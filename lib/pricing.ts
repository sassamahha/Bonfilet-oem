// lib/pricing.ts

export type PricingTier = { min: number; max: number; unit: number };

export type PricingConfig = {
  tiers: PricingTier[];
  // 将来：オプション課金を再開するならここにキーを追加
  options?: Record<string, number>;
};

export function unitPriceForQty(qty: number, config: PricingConfig): number {
  const tier = config.tiers.find(t => qty >= t.min && qty <= t.max);
  // 見つからなければ最大レンジを使う（上限超え対応）
  const picked = tier ?? config.tiers.reduce((a, b) => (a.max > b.max ? a : b));
  return picked.unit;
}

export function calcSubtotal(qty: number, config: PricingConfig): number {
  return Math.round(unitPriceForQty(qty, config) * qty);
}

export type TotalsInput = {
  qty: number;
  currency: 'JPY' | 'USD';
  pricing: PricingConfig;
  shipping: number;     // 送料は呼び出し側で決定
  taxDuties?: number;   // 0 なら省略可
};

export type QuoteBreakdown = {
  currency: 'JPY' | 'USD';
  unit: number;
  subtotal: number;
  shipping: number;
  taxDuties: number;
  total: number;
};

export function calcTotals(input: TotalsInput): QuoteBreakdown {
  const unit = unitPriceForQty(input.qty, input.pricing);
  const subtotal = Math.round(unit * input.qty);
  const taxDuties = input.taxDuties ?? 0;
  const total = subtotal + input.shipping + taxDuties;

  return {
    currency: input.currency,
    unit,
    subtotal,
    shipping: input.shipping,
    taxDuties,
    total
  };
}

// ---- 互換レイヤ（旧APIを呼んでも壊れないように） ---------------
/** 旧: フィールドは無視して単価を返す（finish/size/optionsは固定仕様のため不使用） */
export type QuoteItemInputLegacy = {
  qty: number;
  finish?: string;
  size?: string;
  options?: string[];
};

// 旧関数名と互換（既存コードが import していてもOK）
export function calculateUnitPrice(
  config: PricingConfig,
  input: QuoteItemInputLegacy
): number {
  return unitPriceForQty(input.qty, config);
}

/** 旧: options を数量加算していた名残。現在は0固定で返す */
export function calculateOptions(
  _config: PricingConfig,
  _options: string[] = [],
  _qty: number
): number {
  return 0;
}
