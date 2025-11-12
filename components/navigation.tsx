'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

type Props = {
  currentLocale: 'en' | 'ja';
  localeNames: Record<'en' | 'ja', string>;
};

export default function Navigation({ currentLocale, localeNames }: Props) {
  const t = useTranslations('nav');

  const other = currentLocale === 'en' ? 'ja' : 'en';

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href={`/${currentLocale}`} className="font-semibold">Bonfilet OEM</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href={`/${currentLocale}/order`}>{t('order')}</Link>
          <Link href={`/${currentLocale}/checkout`}>{t('checkout')}</Link>
          <Link href={`/${currentLocale}/orders`}>{t('orders')}</Link>

          <Link
            href={`/${other}`}
            className="rounded bg-slate-900 px-2 py-1 text-white"
            prefetch={false}
          >
            {localeNames[other as 'en' | 'ja']}
          </Link>
        </nav>
      </div>
    </header>
  );
}
