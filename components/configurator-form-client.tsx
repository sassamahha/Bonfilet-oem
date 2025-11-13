'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import ColorPicker from '@/components/color-picker';
import {
  BAND_FINISHES,
  BAND_SIZES,
  BODY_COLORS,
  DEFAULT_BODY_COLOR,
  DEFAULT_FINISH,
  DEFAULT_SIZE,
  DEFAULT_TEXT_COLOR,
  TEXT_COLORS,
  resolveColorHex,
  resolveColorLabel,
  type BandColorId,
  type BandFinishId,
  type BandSizeId
} from '@/config/band';
import { hydratePricing, type SerializedPricing } from '@/lib/pricing/client';
import type { QuoteBreakdown } from '@/lib/pricing';

type QuoteResponse = QuoteBreakdown & {
  etaDays: [number, number];
  needsReview: boolean;
  errors: string[];
};

type FormState = {
  message: string;
  qty: number;
  country: string;
  bodyColor: BandColorId;
  bodyColorCustom: string;
  textColor: BandColorId;
  textColorCustom: string;
  finish: BandFinishId;
  size: BandSizeId;
};

const defaultFormState: FormState = {
  message: 'ONE TEAM, ONE MESSAGE',
  qty: 30,
  country: 'US',
  bodyColor: DEFAULT_BODY_COLOR,
  bodyColorCustom: resolveColorHex(DEFAULT_BODY_COLOR),
  textColor: DEFAULT_TEXT_COLOR,
  textColorCustom: resolveColorHex(DEFAULT_TEXT_COLOR),
  finish: DEFAULT_FINISH,
  size: DEFAULT_SIZE
};

type Props = {
  pricing: SerializedPricing;
};

export default function ConfiguratorFormClient({ pricing }: Props) {
  const t = useTranslations('order');
  const quoteT = useTranslations('quote');
  const pricingState = useMemo(() => hydratePricing(pricing), [pricing]);
  const [form, setForm] = useState<FormState>(() => ({
    ...defaultFormState,
    qty: pricingState.tiers[0]?.min ?? defaultFormState.qty
  }));
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const getColorLabel = (color: BandColorId) =>
    t(`colors.${color}` as const, { defaultMessage: resolveColorLabel(color) });

  const bodyColorOptions = useMemo(
    () =>
      BODY_COLORS.map((color) => ({
        id: color,
        label: getColorLabel(color),
        hex: color === 'custom' ? form.bodyColorCustom : resolveColorHex(color),
        isCustom: color === 'custom'
      })),
    [form.bodyColorCustom, t]
  );

  const textColorOptions = useMemo(
    () =>
      TEXT_COLORS.map((color) => ({
        id: color,
        label: getColorLabel(color),
        hex: color === 'custom' ? form.textColorCustom : resolveColorHex(color),
        isCustom: color === 'custom'
      })),
    [form.textColorCustom, t]
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchQuote() {
      setIsLoading(true);
      setQuoteError(null);

      try {
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
                bodyColorHex: resolveColorHex(form.bodyColor, form.bodyColorCustom),
                textColorHex: resolveColorHex(form.textColor, form.textColorCustom),
                finish: form.finish,
                size: form.size,
                qty: form.qty
              }
            ],
            shipTo: { country: form.country },
            currency: pricingState.currency
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Quote request failed');
        }

        const data = (await response.json()) as QuoteResponse;
        if (!ignore) {
          setQuote(data);
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setQuote(null);
        setQuoteError(t('quoteError'));
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void fetchQuote();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [
    form.message,
    form.qty,
    form.country,
    form.bodyColor,
    form.textColor,
    form.bodyColorCustom,
    form.textColorCustom,
    form.finish,
    form.size,
    pricingState.currency,
    t
  ]);

  const minQty = pricingState.tiers[0]?.min ?? 1;
  const maxQty = pricingState.tiers[pricingState.tiers.length - 1]?.max ?? 99999;

  const previewBodyHex = resolveColorHex(form.bodyColor, form.bodyColorCustom);
  const previewTextHex = resolveColorHex(form.textColor, form.textColorCustom);
  const previewMessage = form.message.trim() || t('placeholder');
  const sizeLabel = BAND_SIZES.find((size) => size.id === form.size)?.label ?? form.size;
  const finishLabel = BAND_FINISHES.find((finish) => finish.id === form.finish)?.label ?? form.finish;

  const formatQuoteCurrency = (amount: number) => {
    return pricingState.format(amount);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="space-y-6" aria-label="Bonfilet configurator form">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="message">
            {t('message')}
          </label>
          <textarea
            id="message"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand-accent"
            value={form.message}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                message: event.target.value
              }))
            }
            maxLength={40}
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
              min={minQty}
              max={maxQty}
              value={form.qty}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  qty: (() => {
                    const raw = Number.parseInt(event.target.value || '0', 10);
                    if (Number.isNaN(raw)) {
                      return prev.qty;
                    }
                    return Math.min(maxQty, Math.max(minQty, raw));
                  })()
                }))
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
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  country: event.target.value.toUpperCase()
                }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-accent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            name="body-color"
            label={t('bodyColor')}
            options={bodyColorOptions}
            selected={form.bodyColor}
            customHex={form.bodyColorCustom}
            customLabel={t('customColorInput')}
            onSelect={(color) =>
              setForm((prev) => ({
                ...prev,
                bodyColor: color
              }))
            }
            onCustomChange={(hex) =>
              setForm((prev) => ({
                ...prev,
                bodyColor: prev.bodyColor === 'custom' ? prev.bodyColor : 'custom',
                bodyColorCustom: hex
              }))
            }
          />
          <ColorPicker
            name="text-color"
            label={t('textColor')}
            options={textColorOptions}
            selected={form.textColor}
            customHex={form.textColorCustom}
            customLabel={t('customColorInput')}
            onSelect={(color) =>
              setForm((prev) => ({
                ...prev,
                textColor: color
              }))
            }
            onCustomChange={(hex) =>
              setForm((prev) => ({
                ...prev,
                textColor: prev.textColor === 'custom' ? prev.textColor : 'custom',
                textColorCustom: hex
              }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block text-sm font-semibold text-slate-700">{t('size')}</span>
            <div className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {sizeLabel}
            </div>
          </div>
          <div>
            <span className="block text-sm font-semibold text-slate-700">{t('finish')}</span>
            <div className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {finishLabel}
            </div>
          </div>
        </div>
      </form>
      <aside className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('preview')}</h3>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div
              className="flex h-32 items-center justify-center rounded-md"
              style={{
                backgroundColor: previewBodyHex,
                color: previewTextHex,
                border: '1px solid rgba(15,23,42,0.1)'
              }}
            >
              <span className="text-lg font-semibold leading-tight text-center" style={{ color: previewTextHex }}>
                {previewMessage}
              </span>
            </div>
            <dl className="mt-3 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <dt>{t('bodyColor')}</dt>
                <dd>{getColorLabel(form.bodyColor)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t('textColor')}</dt>
                <dd>{getColorLabel(form.textColor)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t('size')}</dt>
                <dd>{sizeLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t('finish')}</dt>
                <dd>{finishLabel}</dd>
              </div>
            </dl>
          </div>
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
            <p className="text-sm text-slate-500">{isLoading ? t('calculating') : t('quoteUnavailable')}</p>
          )}
          {quote && (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>{quoteT('subtotal')}</span>
                <span>{formatQuoteCurrency(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{quoteT('shipping')}</span>
                <span>{formatQuoteCurrency(quote.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>{quoteT('tax')}</span>
                <span>{formatQuoteCurrency(quote.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>{quoteT('duties')}</span>
                <span>{formatQuoteCurrency(quote.duties)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{quoteT('total')}</span>
                <span>{formatQuoteCurrency(quote.total)}</span>
              </div>
            </div>
          )}
          {isLoading && <p className="text-xs text-slate-400">Updating quote…</p>}
          {quoteError && <p className="text-xs text-red-600">{quoteError}</p>}
          {quote?.needsReview && (
            <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-xs text-amber-700">{t('forbidden')}</p>
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
