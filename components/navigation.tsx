'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n';

type Props = {
  currentLocale: Locale;
  localeNames: Record<Locale, string>;
};

const navItems = [
  { href: '/order', messageKey: 'nav.order' },
  { href: '/checkout', messageKey: 'nav.checkout' },
  { href: '/account/orders', messageKey: 'nav.orders' }
];

export default function Navigation({ currentLocale, localeNames }: Props) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const basePath = `/${currentLocale}`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href={`${basePath}`} className="text-lg font-semibold text-brand-primary">
          Bonfilet OEM
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const href = `${basePath}${item.href}`;
            const isActive = pathname?.startsWith(href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`transition-colors ${isActive ? 'text-brand-accent' : 'hover:text-brand-accent'}`}
              >
                {t(item.messageKey)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {Object.entries(localeNames).map(([locale, name]) => {
            const href = `/${locale}${pathname?.replace(/^\/[a-z]{2}/, '') ?? ''}`;
            const isCurrent = locale === currentLocale;
            return (
              <Link
                key={locale}
                href={href}
                className={`rounded px-2 py-1 transition ${
                  isCurrent ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
                }`}
              >
                {name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
