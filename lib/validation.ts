import { getForbiddenWords } from './data';

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
