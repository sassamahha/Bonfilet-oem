import { getLeadTimeConfig } from '@/lib/data';

export type QuoteDestination = {
  shipTo: {
    country: string;
  };
};

export async function calculateEta(input: QuoteDestination): Promise<[number, number]> {
  const config = await getLeadTimeConfig();
  const country = input.shipTo.country?.toUpperCase() ?? '';
  const base = config.base_production_days;
  const entry = config.country_zone[country];

  if (!entry) {
    return [base + 5, base + 10];
  }

  const [minDays, maxDays] = entry.days;
  return [base + minDays, base + maxDays];
}
