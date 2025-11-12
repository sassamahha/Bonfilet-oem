import {getColorConfig, getPricingConfig} from '@/lib/data';
import ConfiguratorForm from '@/components/configurator-form';
import type {Locale} from '@/lib/i18n';
import {getTranslations} from 'next-intl/server';

export default async function OrderPage({
  params
}: {
  params: { locale: Locale };
}) {
  const [pricing, colors] = await Promise.all([
    getPricingConfig(),
    getColorConfig()
  ]);
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'order'
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">{t('title')}</h1>
      <p className="mt-2 text-sm text-slate-600">{t('subtitle')}</p>

      <div className="mt-10">
        <ConfiguratorForm pricing={pricing} colors={colors} locale={params.locale} />
      </div>
    </div>
  );
}
