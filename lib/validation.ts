// lib/validation.ts
import { getForbiddenWords } from './data';
import { sanitizeMessage, effectiveLengthUnits, maxUnitsFor, hasCJK } from './textlen';

export type MessageValidationResult = {
  isValid: boolean;
  needsReview: boolean;
  errors: string[];
  meta?: {
    units: number;
    maxUnits: number;
    isCJK: boolean;
  };
};

export async function validateMessage(message: string): Promise<MessageValidationResult> {
  const normalized = sanitizeMessage(message);

  const errors: string[] = [];
  if (normalized.length === 0) errors.push('Message cannot be empty.');

  const isCJKMsg = hasCJK(normalized);
  const units = effectiveLengthUnits(normalized);
  const maxUnits = maxUnitsFor(normalized); // 50 if CJK present, else 40

  if (units > maxUnits) {
    // 表示用エラー文言は i18n に合わせて後で差し替え可
    errors.push(isCJKMsg ? 'Message exceeds 25 full-width characters.' : 'Message exceeds 40 characters.');
  }

  const forbiddenWords = await getForbiddenWords();
  const lower = normalized.toLowerCase();
  const needsReview = forbiddenWords.some((word) => lower.includes(word));

  return {
    isValid: errors.length === 0,
    needsReview,
    errors,
    meta: { units, maxUnits, isCJK: isCJKMsg }
  };
}
