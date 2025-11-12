import { z } from 'zod';

import { getForbiddenWords } from '@/lib/data';
import type { QuoteItemInput } from '@/lib/pricing';

export type MessageValidationResult = {
  isValid: boolean;
  needsReview: boolean;
  errors: string[];
};

export class QuoteValidationError extends Error {
  body: { message: string; issues?: z.ZodIssue[] };

  constructor(message: string, issues?: z.ZodIssue[]) {
    super(message);
    this.name = 'QuoteValidationError';
    this.body = { message, issues };
  }
}

const quoteSchema = z.object({
  currency: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, { message: 'No item provided' }),
  shipTo: z.object({
    country: z.string().min(2),
    postal: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional()
  })
});

  shipTo: { country: string };
  currency: string;
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

export async function parseQuoteRequest(raw: unknown): Promise<ParsedQuoteRequest> {
  const result = quoteSchema.safeParse(raw);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new QuoteValidationError(firstIssue?.message ?? 'Invalid quote payload', result.error.issues);
  }

  const { items, shipTo, currency } = result.data;
  const messageChecks = await Promise.all(items.map((item) => validateMessage(item.messageText)));
  const needsReview = messageChecks.some((check) => check.needsReview);
  const errors = messageChecks.flatMap((check) => check.errors);

  }));

  return {
    items: normalizedItems,
    shipTo: { country: shipTo.country.toUpperCase() },
    currency: currency ?? 'JPY',
    needsReview,
    errors
  };
}
