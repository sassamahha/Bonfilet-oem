import ConfiguratorForm from '@/components/configurator-form';
import { DISPLAY_CURRENCIES, formatCurrency } from '@/lib/currency';
import type { Locale } from '@/lib/i18n';
import { getTranslations } from 'next-intl/server';

export default async function OrderPage({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'order' });
  const pricingT = await getTranslations({ locale: params.locale, namespace: 'pricing' });
  const numberFormatter = new Intl.NumberFormat(params.locale);
  const currencyColumns = DISPLAY_CURRENCIES.map((currency) => ({
    currency,
    label: pricingT('currencyHeader', { currency })
  }));
  const renderRange = (tier: (typeof pricing.tiers)[number]) => {
    const formattedMin = numberFormatter.format(tier.min);
    if (tier.max >= 99999) {
      return pricingT('rangeLabelOpen', { min: formattedMin });
    }
    const formattedMax = numberFormatter.format(tier.max);
    return pricingT('rangeLabel', { min: formattedMin, max: formattedMax });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Configure message, colors, finish and quantity. Pricing updates instantly and reflects shipping, tax and duties.
      </p>
      <div className="mt-10">
        <ConfiguratorForm pricing={pricing} />
      </div>
      <section id="pricing" className="mt-16">
        <h2 className="text-2xl font-semibold text-slate-900">{pricingT('title')}</h2>
        <p className="mt-2 text-sm text-slate-600">{pricingT('subtitle')}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th scope="col" className="px-4 py-3">
                  {pricingT('rangeHeader')}
                </th>
                {currencyColumns.map((column) => (
                  <th key={column.currency} scope="col" className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm text-slate-700">
              {pricing.tiers.map((tier) => (
                <tr key={`${tier.min}-${tier.max}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{renderRange(tier)}</td>
                  {currencyColumns.map((column) => (
                    <td key={column.currency} className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {formatCurrency(tier.unit, column.currency, params.locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">{pricingT('disclaimer')}</p>
      </section>
    </div>
  );
}
