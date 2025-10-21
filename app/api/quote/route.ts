import { NextResponse } from 'next/server';
import { getLeadTimeConfig, getPricingConfig } from '@/lib/data';
import { calculateEta } from '@/lib/eta';
import { calculateQuote } from '@/lib/pricing';
import { validateMessage } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  const item = body.items?.[0];
  const country = body.shipTo?.country ?? 'US';

  const [pricing, leadtime, validation] = await Promise.all([
    getPricingConfig(),
    getLeadTimeConfig(),
    validateMessage(item?.messageText ?? '')
  ]);

  if (!item) {
    return NextResponse.json(
      { message: 'No item provided', errors: ['No item provided'], needsReview: false },
      { status: 400 }
    );
  }

  const shipping = 25 + Math.max(0, item.qty - 30) * 0.15;
  const taxRate = 0.1;
  const dutiesRate = 0.05;

  const quote = calculateQuote(
    pricing,
    {
      qty: item.qty,
      finish: item.finish,
      size: item.size,
      options: item.options ?? []
    },
    { shipping, taxRate, dutiesRate }
  );

  const etaDays = calculateEta(leadtime, country);

  return NextResponse.json({
    ...quote,
    etaDays,
    needsReview: validation.needsReview,
    errors: validation.errors
  });
}
