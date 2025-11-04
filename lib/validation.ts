import { getForbiddenWords } from './data';

export const supportedMarkets = ['jp', 'global'] as const;
export type SupportedMarket = (typeof supportedMarkets)[number];

export const supportedCurrencies = ['JPY', 'USD'] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export type QuoteItem = {
  productType: string;
  messageText: string;
  bodyColor: string;
  textColor: string;
  finish: string;
  size: string;
  qty: number;
  options: string[];
};

export type QuoteRequest = {
  items: QuoteItem[];
  shipTo: { country: string };
  market?: SupportedMarket;
  currency?: SupportedCurrency;
};

export type ParsedQuoteRequest = {
  items: QuoteItem[];
  shipTo: { country: string };
  market: SupportedMarket;
  currency: SupportedCurrency;
  needsReview: boolean;
  errors: string[];
};

export class QuoteValidationError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: { message: string; errors: string[]; needsReview: boolean }
  ) {
    super(body.message);
  }
}

export type MessageValidationResult = {
  isValid: boolean;
  needsReview: boolean;
  errors: string[];
};

export async function validateMessage(message: string): Promise<MessageValidationResult> {
  const normalized = message.normalize('NFKC');
  const trimmed = normalized.trim();
  const errors: string[] = [];

  if (trimmed.length === 0) {
    errors.push('Message cannot be empty.');
  }

  if (trimmed.length > 40) {
    errors.push('Message exceeds 40 characters.');
  }

  const forbiddenWords = await getForbiddenWords();
  const lower = trimmed.toLowerCase();
  const needsReview = forbiddenWords.some((word) => lower.includes(word));

  return {
    isValid: errors.length === 0,
    needsReview,
    errors
  };
}

function ensureString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseQuantity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function resolveMarket(value: unknown): SupportedMarket {
  if (value == null) {
    return 'jp';
  }
  if (typeof value === 'string' && supportedMarkets.includes(value as SupportedMarket)) {
    return value as SupportedMarket;
  }
  throw new QuoteValidationError(400, {
    message: 'Unsupported market value',
    errors: ['Unsupported market value'],
    needsReview: false
  });
}

function resolveCurrency(value: unknown): SupportedCurrency {
  if (value == null) {
    return 'JPY';
  }
  if (typeof value === 'string' && supportedCurrencies.includes(value as SupportedCurrency)) {
    return value as SupportedCurrency;
  }
  throw new QuoteValidationError(400, {
    message: 'Unsupported currency value',
    errors: ['Unsupported currency value'],
    needsReview: false
  });
}

export async function parseQuoteRequest(raw: unknown): Promise<ParsedQuoteRequest> {
  if (raw == null || typeof raw !== 'object') {
    throw new QuoteValidationError(400, {
      message: 'Invalid quote request',
      errors: ['Invalid quote request'],
      needsReview: false
    });
  }

  const data = raw as Record<string, unknown>;
  const itemsRaw = data.items;

  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new QuoteValidationError(400, {
      message: 'No item provided',
      errors: ['No item provided'],
      needsReview: false
    });
  }

  const first = itemsRaw[0];
  if (first == null || typeof first !== 'object') {
    throw new QuoteValidationError(400, {
      message: 'No item provided',
      errors: ['No item provided'],
      needsReview: false
    });
  }

  const itemData = first as Record<string, unknown>;
  const messageText = ensureString(itemData.messageText, '');
  const validation = await validateMessage(messageText);

  const qty = parseQuantity(itemData.qty);

  const optionsRaw = Array.isArray(itemData.options) ? itemData.options : [];
  const options = optionsRaw.map((option) => String(option ?? ''));

  const item: QuoteItem = {
    productType: ensureString(itemData.productType, 'bonfilet'),
    messageText,
    bodyColor: ensureString(itemData.bodyColor),
    textColor: ensureString(itemData.textColor),
    finish: ensureString(itemData.finish),
    size: ensureString(itemData.size),
    qty: Math.max(0, Number.isFinite(qty) ? qty : 0),
    options
  };

  const shipToRaw = data.shipTo;
  const countryValue =
    shipToRaw && typeof shipToRaw === 'object' && 'country' in (shipToRaw as Record<string, unknown>)
      ? ensureString((shipToRaw as Record<string, unknown>).country, 'US')
      : 'US';

  const shipTo = { country: countryValue.toUpperCase() };

  const market = resolveMarket(data.market);
  const currency = resolveCurrency(data.currency);

  return {
    items: [item],
    shipTo,
    market,
    currency,
    needsReview: validation.needsReview,
    errors: validation.errors
  };
}
