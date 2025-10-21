'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ColorConfig, PricingConfig } from '@/lib/data';
import type { QuoteBreakdown } from '@/lib/pricing';

export type ConfiguratorData = {
  pricing: PricingConfig;
  colors: ColorConfig;
};

type QuoteResponse = QuoteBreakdown & {
  etaDays: [number, number];
  needsReview: boolean;
  errors: string[];
};

const defaultFormState = {
  message: 'ONE TEAM, ONE MESSAGE',
  qty: 30,
  font: 'NotoSans',
  bodyColor: 'black',
  textColor: 'white',
  finish: 'normal',
  size: '12mm/202mm',
  options: [] as string[],
  country: 'US'
};

type Props = ConfiguratorData;

export default function ConfiguratorForm({ pricing, colors }: Props) {
  const t = useTranslations('order');
  const [form, setForm] = useState(defaultFormState);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const optionKeys = useMemo(() => Object.keys(pricing.options), [pricing.options]);

  useEffect(() => {
    let ignore = false;
    async function fetchQuote() {
      setIsLoading(true);
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              productType: 'bonfilet',
              messageText: form.message,
              bodyColor: form.bodyColor,
              textColor: form.textColor,
              finish: form.finish,
              size: form.size,
              qty: form.qty,
              options: form.options
            }
          ],
          shipTo: { country: form.country }
        })
      });
      const data = (await response.json()) as QuoteResponse;
      if (!ignore) {
        setQuote(data);
        setIsLoading(false);
      }
    }

    void fetchQuote();

    return () => {
      ignore = true;
    };
  }, [form.message, form.qty, form.finish, form.size, form.bodyColor, form.textColor, form.options, form.country]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="message">
            {t('message')}
          </label>
          <textarea
            id="message"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-accent"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            maxLength={80}
            rows={2}
          />
          <p className="mt-1 text-xs text-slate-500">{t('placeholder')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="quantity">
              {t('quantity')}
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={999}
              value={form.qty}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, qty: Number.parseInt(event.target.value || '0', 10) }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="country">
              Ship to country
            </label>
            <input
              id="country"
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value.toUpperCase() }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="bodyColor">
              {t('bodyColor')}
            </label>
            <select
              id="bodyColor"
              value={form.bodyColor}
              onChange={(event) => setForm((prev) => ({ ...prev, bodyColor: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            >
              {colors.body.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="textColor">
              {t('textColor')}
            </label>
            <select
              id="textColor"
              value={form.textColor}
              onChange={(event) => setForm((prev) => ({ ...prev, textColor: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            >
              {colors.text.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="finish">
              {t('finish')}
            </label>
            <select
              id="finish"
              value={form.finish}
              onChange={(event) => setForm((prev) => ({ ...prev, finish: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            >
              {Object.keys(pricing.coeff.finish).map((finish) => (
                <option key={finish} value={finish}>
                  {finish}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700" htmlFor="size">
              {t('size')}
            </label>
            <select
              id="size"
              value={form.size}
              onChange={(event) => setForm((prev) => ({ ...prev, size: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            >
              {Object.keys(pricing.coeff.size).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span className="block text-sm font-semibold text-slate-700">{t('options')}</span>
          <div className="mt-2 flex flex-wrap gap-4">
            {optionKeys.map((option) => {
              const checked = form.options.includes(option);
              return (
                <label key={option} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const { checked: isChecked } = event.target;
                      setForm((prev) => ({
                        ...prev,
                        options: isChecked
                          ? [...prev.options, option]
                          : prev.options.filter((item) => item !== option)
                      }));
                    }}
                  />
                  <span>
                    {option}
                    <span className="ml-2 text-xs text-slate-400">
                      +{pricing.options[option].toFixed(2)} {pricing.currency}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </form>
      <aside className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('preview')}</h3>
          <div className="mt-4 flex h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white">
            <span className="text-lg font-semibold" style={{ color: form.textColor }}>
              {form.message}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {colors.body.find((color) => color.id === form.bodyColor)?.label} ·{' '}
            {colors.text.find((color) => color.id === form.textColor)?.label}
          </p>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('quote')}</h3>
          {quote ? (
            <ul className="space-y-1 text-sm text-slate-700">
              <li className="flex justify-between">
                <span>{t('quantity')}</span>
                <span>{form.qty}</span>
              </li>
              <li className="flex justify-between">
                <span>{t('arrival')}</span>
                <span>
                  {quote.etaDays[0]}–{quote.etaDays[1]} days
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Calculating...</p>
          )}
          {quote && (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {quote.currency} {quote.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {quote.currency} {quote.shipping.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>
                  {quote.currency} {quote.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duties</span>
                <span>
                  {quote.currency} {quote.duties.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {quote.currency} {quote.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {isLoading && <p className="text-xs text-slate-400">Updating quote…</p>}
          {quote?.needsReview && (
            <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-xs text-amber-700">
              {t('forbidden')}
            </p>
          )}
          {quote && quote.errors.length > 0 && (
            <ul className="space-y-1 text-xs text-red-600">
              {quote.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
