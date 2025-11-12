import { getPricingConfig } from '@/lib/data';
import { calcTotals } from '@/lib/pricing';

const SHIPPING_TABLE = {
  JPY: (_country: string, _qty: number) => 1200,
  USD: (_country: string, _qty: number) => 20
};

export async function POST(req: Request) {
  const body = await req.json();
  const item = body.items[0];
  const currency: 'JPY' | 'USD' = body.currency ?? (body.shipTo.country === 'JP' ? 'JPY' : 'USD');

  const pricing = await getPricingConfig();
  const shipping = SHIPPING_TABLE[currency](body.shipTo.country, item.qty);

  const totals = calcTotals({
    qty: item.qty,
    currency,
    pricing,
    shipping,
    taxDuties: 0
  });

  return Response.json({
    currency: totals.currency,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    taxDuties: totals.taxDuties,
    total: totals.total,
    eta: { from: '2025-11-09', to: '2025-11-11' } // 実装済みのETAに置き換え
  });
}
