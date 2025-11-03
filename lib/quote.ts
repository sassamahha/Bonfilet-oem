import { calculateEta } from './eta';
import { calculatePrice } from './pricing';
import { parseQuoteRequest } from './validation';

export async function createQuote(raw: unknown) {
  const input = await parseQuoteRequest(raw);
  const [price, etaDays] = await Promise.all([
    calculatePrice(input),
    calculateEta(input)
  ]);

  return {
    ...price,
    etaDays,
    needsReview: input.needsReview,
    errors: input.errors
  };
}
