import { z } from 'zod';

import { getForbiddenWords } from '@/lib/data';
import type { QuoteItemInput } from '@/lib/pricing';
import { BODY_COLORS, DEFAULT_FINISH, DEFAULT_SIZE, TEXT_COLORS, resolveColorHex } from '@/config/band';

const bodyColorSchema = z.enum(BODY_COLORS);
const textColorSchema = z.enum(TEXT_COLORS);
const finishSchema = z.literal(DEFAULT_FINISH);
const sizeSchema = z.literal(DEFAULT_SIZE);
const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, { message: 'Invalid color hex value' });

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

const quoteItemSchema = z
  .object({
    productType: z.literal('bonfilet'),
    messageText: z.string().min(1).max(40),
    font: z.string().optional(),
    bodyColor: bodyColorSchema,
    textColor: textColorSchema,
    bodyColorHex: hexColorSchema.optional(),
    textColorHex: hexColorSchema.optional(),
    finish: finishSchema,
    size: sizeSchema,
    qty: z.number().int().min(1).max(99999),
    options: z.array(z.string()).optional()
  })
  .superRefine((value, ctx) => {
    if (value.bodyColor === 'custom' && !value.bodyColorHex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom body color hex is required',
        path: ['bodyColorHex']
      });
    }

    if (value.textColor === 'custom' && !value.textColorHex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom text color hex is required',
        path: ['textColorHex']
      });
    }
  });

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

export type ParsedQuoteItem = QuoteItemInput & {
  bodyColor: z.infer<typeof bodyColorSchema>;
  textColor: z.infer<typeof textColorSchema>;
  bodyColorHex: string;
  textColorHex: string;
};

export type ParsedQuoteRequest = {
  items: ParsedQuoteItem[];
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

  const normalizedItems: ParsedQuoteItem[] = items.map((item) => ({
    qty: item.qty,
    finish: item.finish,
    size: item.size,
    options: item.options ?? [],
    bodyColor: item.bodyColor,
    textColor: item.textColor,
    bodyColorHex: resolveColorHex(item.bodyColor, item.bodyColorHex),
    textColorHex: resolveColorHex(item.textColor, item.textColorHex)
  }));

  return {
    items: normalizedItems,
    shipTo: { country: shipTo.country.toUpperCase() },
    currency: currency ?? 'JPY',
    needsReview,
    errors
  };
}
