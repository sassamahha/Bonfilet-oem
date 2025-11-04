import { getColorConfig, getPricingConfig } from '@/lib/data';
import ConfiguratorForm from '@/components/configurator-form';
import type { Locale } from '@/lib/i18n';
import { getTranslator } from 'next-intl/server';

export default async function OrderPage({ params }: { params: { locale: Locale } }) {
  const [pricing, colors] = await Promise.all([getPricingConfig(), getColorConfig()]);
  const t = await getTranslator(params.locale, 'order');

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Configure message, colors, finish and quantity. Pricing updates instantly and reflects shipping, tax and duties.
      </p>
      <div className="mt-10">
        <ConfiguratorForm pricing={pricing} colors={colors} />
      </div>
    </div>
  );
}
