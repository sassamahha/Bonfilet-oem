import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import type {Locale} from '@/lib/i18n';

export default async function MarketingPage({
  params
}: { params: { locale: Locale } }) {
  // v3 API
  const t   = await getTranslations({ locale: params.locale, namespace: 'hero' });
  const cta = await getTranslations({ locale: params.locale, namespace: 'cta' });

  return (
    <div className="bg-gradient-to-b from-white to-slate-50">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24">
        <span className="rounded-full bg-brand-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
          Global fulfillment
        </span>

        <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">{t('subtitle')}</p>

        <div className="flex flex-wrap gap-4">
          <Link
            href={`/${params.locale}/order`}
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {cta('configure')}
          </Link>
          <Link
            href={`/${params.locale}/order#pricing`}
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            {cta('viewPricing')}
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              title: 'Real-time pricing',
              description:
                'Live quote including shipping, tax, duties and arrival window.'
            },
            {
              title: 'Manufactured in 3 days',
              description:
                'Automated prepress → production → QC → global shipping updates.'
            },
            {
              title: 'Designed for scaling',
              description:
                'Locale-aware checkout, Stripe payments, operations dashboard built-in.'
            }
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
